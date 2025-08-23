from typing import Any, Dict, List, Optional
import os
import json
import logging
from ai_sdk import anthropic, generate_text
from constants import specialists
import dotenv

dotenv.load_dotenv()


def _sse(event: str, data: Dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _select_expert_by_specialty(text: str) -> Dict[str, Any]:
    text_lower = text.lower()
    best: Optional[Dict[str, Any]] = None
    best_score = -1
    for spec in specialists:
        score = 0
        for field in spec.get("specialties", []):
            if not isinstance(field, str):
                continue
            if field.lower() in text_lower:
                score += 2
            for token in field.lower().split():
                if token and token in text_lower:
                    score += 1
        if score > best_score:
            best_score = score
            best = {
                "email": spec.get("email"),
                "specialties": spec.get("specialties", []),
                "score": score,
            }
    return best or {"email": None, "specialties": [], "score": 0}


def _select_expert_via_llm(model, subject: str, body_text: str) -> Dict[str, Any]:
    """
    Ask the LLM to pick the best specialist. Returns {email, reason} or falls back.
    """
    try:
        spec_json = json.dumps(specialists, ensure_ascii=False)
        prompt = (
            "You are selecting the best legal specialist to handle an incoming client email.\n"
            "Choose the most relevant specialist based on the email content and the list below.\n"
            'Return STRICT JSON only in this exact schema: {"email": string, "reason": string}.\n\n'
            f"SPECIALISTS:\n{spec_json}\n\n"
            f"EMAIL SUBJECT:\n{subject}\n\n"
            f"EMAIL BODY:\n{body_text[:8000]}\n"
        )
        res = generate_text(model=model, prompt=prompt, tools=[])
        raw = (res.text or "").strip()
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            raw = raw[start : end + 1]
        data = json.loads(raw)
        email = data.get("email")
        reason = data.get("reason")
        if isinstance(email, str) and email:
            # find matching specialist to attach specialties
            match = next((s for s in specialists if s.get("email") == email), None)
            return {
                "email": email,
                "specialties": (match or {}).get("specialties", []),
                "reason": reason,
            }
    except Exception:
        logging.exception("expert selection via LLM failed; falling back")
    # Fallback heuristic
    fb = _select_expert_by_specialty(f"{subject}\n\n{body_text}")
    fb["reason"] = "Heuristic specialty match fallback"
    return fb


def run_workflow_sse(message: str, title: str, send_email: bool = False):
    yield _sse("status", {"message": "starting_workflow"})

    try:
        from agentmail import AgentMail  # type: ignore
    except Exception as exc:
        yield _sse("error", {"stage": "import_agentmail", "error": str(exc)})
        return

    api_key = os.getenv("AGENT_MAIL_API_KEY")
    if not api_key:
        yield _sse(
            "error", {"stage": "config", "error": "AGENT_MAIL_API_KEY is not set"}
        )
        return

    inbox_id_env = os.getenv("INBOX_ID", "donneragent@agentmail.to")
    inbox_display_env = os.getenv("INBOX_DISPLAY", "Donna")

    try:
        client = AgentMail(api_key=api_key)
        yield _sse("status", {"message": "creating_initial_message"})
        # Create initial message in target inbox
        sent = client.inboxes.messages.send(
            inbox_id="donnauser@agentmail.to",
            subject=title,
            text=message,
            to=inbox_id_env,
        )
        message_id = (sent or {}).get("id") if isinstance(sent, dict) else None
        if not message_id:
            yield _sse(
                "warning",
                {
                    "message": "message_id not returned; proceeding with provided content"
                },
            )
    except Exception as exc:
        yield _sse("error", {"stage": "create_initial_message", "error": str(exc)})
        return

    subject = title or ""
    body_text = message or ""
    yield _sse("email_created", {"subject": subject, "size": len(body_text)})

    model = anthropic(
        "claude-sonnet-4-20250514",
        temperature=0.0,
        api_key=os.getenv("ANTHROPIC_API_KEY"),
    )

    yield _sse("status", {"message": "generating_title"})
    try:
        title_res = generate_text(
            model=model,
            prompt=(
                "Create a concise, 3-7 word case title summarizing this email. "
                "No quotes. No ending punctuation. Title Case.\n\n" + body_text[:4000]
            ),
            tools=[],
        )
        case_title = (title_res.text or "").strip().strip("\"'")
        if case_title.endswith((".", "!", "?")):
            case_title = case_title[:-1].strip()
    except Exception:
        logging.exception("workflow: title generation failed")
        case_title = (subject or body_text[:60]).strip() + (
            "…" if len(subject or body_text) > 60 else ""
        )
    yield _sse("title", {"title": case_title})

    yield _sse("status", {"message": "generating_questions"})
    prompt_questions = (
        "You are a senior litigation associate preparing to brief a specialist on a new matter.\n"
        "From the client's email, craft two comprehensive sets of probing questions for the expert.\n"
        "Guidance:\n"
        "- Be creative yet practical and grounded in real legal practice.\n"
        "- Write precise, answerable questions that elicit key facts, dates, parties, documents, jurisdictions, damages, procedural posture, defenses, and risk.\n"
        "- Do not assume facts; ask to confirm or narrow uncertainties.\n"
        "- Quantity targets: 10–15 viability questions; 6–12 cross-field questions.\n"
        'Return STRICT JSON only in this exact schema: {"viability_questions": string[], "cross_field_questions": string[]}\n\n'
        f"EMAIL:\n{body_text[:8000]}\n"
    )
    questions_json: Dict[str, Any] = {
        "viability_questions": [],
        "cross_field_questions": [],
    }
    try:
        q_res = generate_text(model=model, prompt=prompt_questions, tools=[])
        raw = (q_res.text or "").strip()
        try:
            start = raw.find("{")
            end = raw.rfind("}")
            if start != -1 and end != -1 and end > start:
                raw = raw[start : end + 1]
            questions_json = json.loads(raw)
        except Exception:
            pass
    except Exception:
        logging.exception("workflow: question generation failed")
    yield _sse("questions", questions_json)

    yield _sse("status", {"message": "selecting_expert"})
    expert = _select_expert_via_llm(model=model, subject=subject, body_text=body_text)
    yield _sse("expert_selected", expert)

    # Ask the LLM to write the email (subject and body) using the context
    yield _sse("status", {"message": "drafting_email"})
    draft_prompt = (
        "You are Donna, a meticulous legal assistant at the law firm Pearson Specter.\n"
        "Write a formal lawyer-to-lawyer email to the selected expert requesting an assessment of the matter.\n"
        "Tone: professional, court-ready, concise but substantial; law-firm style (no marketing fluff).\n"
        "Length: 180–350 words.\n"
        "Content requirements:\n"
        "- Briefly state the context and working title of the matter.\n"
        "- Provide a 1–2 sentence neutral synopsis of the client's email.\n"
        "- Present the key questions grouped under Viability and Cross-field as clear bullet points.\n"
        "- Ask for conflicts check and availability, and request any additional materials needed.\n"
        "- Close with Donna's signature and the firm name.\n"
        "Formatting: plain text only (no markdown), professional greeting and closing, natural line breaks.\n"
        'Return STRICT JSON only with this schema: {"subject": string, "body": string}.\n\n'
        f"TO_EXPERT: {expert.get('email')}\n"
        f"CASE_TITLE: {case_title}\n"
        f"INQUIRY_SUBJECT: {subject}\n\n"
        f"VIABILITY_QUESTIONS: {json.dumps(questions_json.get('viability_questions', [])[:15], ensure_ascii=False)}\n"
        f"CROSS_FIELD_QUESTIONS: {json.dumps(questions_json.get('cross_field_questions', [])[:12], ensure_ascii=False)}\n\n"
        f"INQUIRY_BODY:\n{body_text[:6000]}\n"
        "Signature to use at end exactly as lines:\nDonna\nPearson Specter\n"
    )
    email_subject = f"Case Inquiry: {case_title}" if case_title else "Case Inquiry"
    email_body = ""
    try:
        draft_res = generate_text(model=model, prompt=draft_prompt, tools=[])
        raw = (draft_res.text or "").strip()
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            raw = raw[start : end + 1]
        draft_json = json.loads(raw)
        subj = draft_json.get("subject")
        body = draft_json.get("body")
        if isinstance(subj, str) and subj.strip():
            email_subject = subj.strip()
        if isinstance(body, str) and body.strip():
            email_body = body.strip()
    except Exception:
        logging.exception("email drafting via LLM failed; using fallback subject/body")
        # Simple fallback body if generation fails
        lines: List[str] = []
        lines.append("Hello,")
        lines.append("")
        lines.append(
            "We received the following inquiry and would value your input as the most relevant specialist."
        )
        lines.append("")
        lines.append(f"Subject: {subject}")
        lines.append("")
        lines.append("Top questions on case viability:")
        for q in questions_json.get("viability_questions", [])[:8]:
            lines.append(f"- {q}")
        lines.append("")
        lines.append("Cross-field questions to consider:")
        for q in questions_json.get("cross_field_questions", [])[:6]:
            lines.append(f"- {q}")
        lines.append("")
        lines.append(
            "Please reply with your assessment and any additional considerations."
        )
        lines.append("")
        lines.append("Thank you.")
        email_body = "\n".join(lines)

    yield _sse(
        "email_draft",
        {"to": expert.get("email"), "subject": email_subject, "text": email_body},
    )

    sent_flag = False
    allow_external = os.getenv("ALLOW_EXTERNAL_EMAIL", "false").lower() in (
        "1",
        "true",
        "yes",
    )
    if not send_email or not expert.get("email"):
        yield _sse("status", {"message": "skipping_send_expert_email"})
    elif not allow_external:
        try:
            yield _sse("status", {"message": "external_email_blocked_saving_internal"})
            _ = client.inboxes.messages.send(
                inbox_id=inbox_id_env,
                subject=f"[DRAFT to {expert.get('email')}] {email_subject}",
                text=email_body,
            )
            yield _sse("internal_saved", {"inbox_id": inbox_id_env})
        except Exception as exc:
            yield _sse("error", {"stage": "save_internal_draft", "error": str(exc)})
    else:
        try:
            sent_result = None
            if hasattr(client, "messages") and hasattr(client.messages, "send"):
                sent_result = client.messages.send(
                    to=expert.get("email"), subject=email_subject, text=email_body
                )
            elif (
                hasattr(client.inboxes.messages, "reply")
                and "message_id" in locals()
                and message_id
            ):
                sent_result = client.inboxes.messages.reply(
                    inbox_id=inbox_id_env,
                    message_id=message_id,
                    subject=email_subject,
                    text=email_body,
                    to=[expert.get("email")],
                )
            else:
                raise RuntimeError("AgentMail send method not available")
            sent_flag = True
            yield _sse(
                "email_sent",
                {"result": sent_result if isinstance(sent_result, dict) else True},
            )
        except Exception as exc:
            yield _sse("error", {"stage": "send_email", "error": str(exc)})

    # Simulate an expert reply (for demo/testing)
    yield _sse("status", {"message": "simulating_expert_reply"})
    simulate_reply_prompt = (
        "You are the selected legal expert receiving the email below.\n"
        "Write a realistic, professional reply to the firm addressing key points and indicating next steps.\n"
        "Tone: lawyer-to-lawyer, precise, no marketing tone.\n"
        "Length: 120–250 words.\n\n"
        f"ORIGINAL_EMAIL_SUBJECT: {email_subject}\n"
        f"ORIGINAL_EMAIL_BODY:\n{email_body[:6000]}\n"
    )
    try:
        reply_res = generate_text(model=model, prompt=simulate_reply_prompt, tools=[])
        expert_reply = (reply_res.text or "").strip()
    except Exception:
        logging.exception("expert reply simulation failed")
        expert_reply = "Thank you for the materials. I am available to review; please send the contract and any correspondence."
    yield _sse("expert_reply", {"from": expert.get("email"), "text": expert_reply})

    # Draft an internal memo for the firm
    yield _sse("status", {"message": "drafting_internal_memo"})
    memo_prompt = (
        "You are Donna at Pearson Specter. Draft an internal case memo summarizing the situation for the team.\n"
        "Audience: partners and senior associates.\n"
        "Tone: formal, analytical, law-firm internal memorandum.\n"
        "Length: 500–900 words.\n"
        "Structure with headings in plain text (no markdown):\n"
        "- Background\n- Key Facts (bullet points)\n- Legal Issues\n- Analysis\n- Pros\n- Cons\n- Risk and Exposure\n- Recommended Next Steps\n\n"
        f"CASE_TITLE: {case_title}\n"
        f"CLIENT_EMAIL_SUBJECT: {subject}\n"
        f"CLIENT_EMAIL_BODY:\n{body_text[:6000]}\n\n"
        f"EXPERT_SELECTED: {expert.get('email')}\n"
        f"EXPERT_REPLY:\n{expert_reply}\n"
        f"VIABILITY_QUESTIONS: {json.dumps(questions_json.get('viability_questions', [])[:15], ensure_ascii=False)}\n"
        f"CROSS_FIELD_QUESTIONS: {json.dumps(questions_json.get('cross_field_questions', [])[:12], ensure_ascii=False)}\n"
    )
    try:
        memo_res = generate_text(model=model, prompt=memo_prompt, tools=[])
        memo_text = (memo_res.text or "").strip()
    except Exception:
        logging.exception("memo generation failed")
        memo_text = "Background\nSummary pending.\n\nKey Facts\n- Pending.\n\nLegal Issues\n- Pending.\n\nAnalysis\n- Pending.\n\nPros\n- Pending.\n\nCons\n- Pending.\n\nRisk and Exposure\n- Pending.\n\nRecommended Next Steps\n- Pending."
    yield _sse("memo", {"title": case_title or "Case Memo", "body": memo_text})

    yield _sse("done", {"sent": sent_flag})
