"use client";
// import Paper from "@/components/paper/paper";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
// import Process from "@/components/process/process";
import Agent from "@/components/agent/agent";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { ChevronRight } from "lucide-react";
import Paper from "@/components/paper/paper";

export interface ResearchSearch {
  query: string;
  citations: string[];
  results: string[];
}

export default function JunoPage() {
  const [paper, setPaper] = useState<string>(`
MASTER SERVICES AGREEMENT (DRAFT)

This Master Services Agreement ("Agreement") is entered into as of the Effective Date by and between Acme Corp., a Delaware corporation with a principal place of business at 123 Market Street, San Francisco, CA 94105 ("Acme" or "Provider"), and Beta LLC, a New York limited liability company with a principal place of business at 456 Madison Avenue, New York, NY 10022 ("Beta" or "Customer"). Provider and Customer are each a "Party" and together the "Parties."

1. Scope of Services. Provider will provide the professional and/or software services described in one or more statements of work executed by the Parties (each, an "SOW"). Each SOW is governed by this Agreement. In the event of a conflict, the SOW controls only with respect to the conflicting term if expressly stated.

2. Fees and Payment. Customer will pay the fees specified in each SOW. Unless otherwise stated, (a) fees are exclusive of taxes, (b) invoices are due net thirty (30) days from receipt, and (c) late amounts may accrue interest at the lesser of 1.5% per month or the maximum rate allowed by law.

3. Confidentiality. "Confidential Information" means non‑public information disclosed by one Party to the other that is designated as confidential or that should reasonably be understood to be confidential given its nature and the circumstances of disclosure. The receiving Party will: (a) use Confidential Information only to perform under this Agreement; (b) not disclose it to any third party except to its employees, contractors, or advisors who need to know and are bound by confidentiality obligations at least as protective; and (c) protect it using at least reasonable care. This Section does not apply to information that is (i) publicly available without breach; (ii) already known without duty of confidentiality; (iii) independently developed; or (iv) rightfully obtained from a third party.

4. Intellectual Property. Except as expressly provided, each Party retains all right, title, and interest in its pre‑existing materials and intellectual property. Unless otherwise specified in an SOW, Provider grants Customer a non‑exclusive, non‑transferable, non‑sublicensable license during the term to use deliverables solely for Customer's internal business purposes.

5. Warranties and Disclaimer. Provider represents and warrants that it will perform the Services in a professional and workmanlike manner. EXCEPT AS EXPRESSLY STATED, THE SERVICES AND DELIVERABLES ARE PROVIDED "AS IS" AND PROVIDER DISCLAIMS ALL OTHER WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON‑INFRINGEMENT.

6. Limitation of Liability. TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEITHER PARTY WILL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL, ARISING OUT OF OR RELATED TO THIS AGREEMENT, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. EXCEPT FOR A PARTY'S INDEMNIFICATION OBLIGATIONS OR BREACH OF SECTION 3 (CONFIDENTIALITY), EACH PARTY'S TOTAL LIABILITY UNDER THIS AGREEMENT WILL NOT EXCEED THE AMOUNTS PAID OR PAYABLE BY CUSTOMER TO PROVIDER UNDER THE APPLICABLE SOW IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM.

7. Indemnification. Each Party will indemnify, defend, and hold harmless the other Party from and against any third‑party claims, damages, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from (a) bodily injury, death, or damage to tangible property to the extent caused by the indemnifying Party's negligence or willful misconduct; or (b) a claim that deliverables provided by the indemnifying Party infringe or misappropriate any intellectual property right of a third party.

8. Data Protection. If the Services involve processing personal data, the Parties will enter into a data processing addendum ("DPA") incorporating appropriate standard contractual clauses, security controls, and subject rights. Provider will implement and maintain administrative, physical, and technical safeguards designed to protect personal data.

9. Term and Termination. This Agreement begins on the Effective Date and continues until terminated by either Party upon thirty (30) days' written notice, or as otherwise specified in an SOW. Either Party may terminate immediately for material breach if not cured within thirty (30) days after written notice.

10. General. Neither Party may assign this Agreement without the other Party's prior written consent, except in connection with a merger, acquisition, or sale of substantially all assets. Notices must be in writing and will be deemed given when delivered by nationally recognized overnight courier or certified mail, return receipt requested, to the addresses first written above. This Agreement is governed by the laws of the State of New York, without regard to its conflict of laws principles, and the Parties consent to exclusive jurisdiction and venue in the state and federal courts located in New York County, New York.

SOW TEMPLATE (EXCERPT)
• Services: Implementation, configuration, and training
• Deliverables: Configured tenant, admin guide
• Fees: Fixed fee of $25,000; expenses at cost
• Milestones: Kickoff, UAT, Production Go‑Live
• Acceptance: Seven (7) days from delivery unless rejected with a written non‑conformance list
`);
  const [toolDiff, setToolDiff] = useState<{ oldText: string; newText: string } | null>(null);
  return (
    <div className="h-full w-full p-2 pt-2 flex-1 min-h-0 flex flex-col">
      <ResizablePanelGroup
        direction="horizontal"
        style={{ overflow: "visible" }}
        className="min-h-0 flex-1"
      >
        <ResizablePanel defaultSize={30} style={{ overflow: "visible" }}>
          <div className="flex flex-col h-full w-full items-start justify-start gap-4 overflow-visible max-w-2xl mx-auto">
            <div className="text-4xl font-serif tracking-tight">Document</div>
            <Paper
              className="min-h-0 w-full flex-1"
              paper={paper}
              setPaper={setPaper}
              toolDiff={toolDiff}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle className="bg-transparent p-2 w-4" />
        <ResizablePanel defaultSize={20}>
          <div className="flex flex-col h-full w-full items-start justify-start gap-4">
            <div className="text-4xl font-serif tracking-tight">Juno Agent</div>
            <Agent
              className="h-full w-full"
              paper={paper}
              setPaper={setPaper}
              onToolDiffPreview={setToolDiff}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
