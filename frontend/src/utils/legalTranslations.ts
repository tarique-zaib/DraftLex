import i18n from "../i18n";

const hiMap: Record<string, string> = {
  "First Hearing": "प्रथम सुनवाई",
  "Bail Arguments": "जमानत पर बहस",
  Evidence: "साक्ष्य",
  "Final Arguments": "अंतिम बहस",
  Judgment: "निर्णय",

  Active: "सक्रिय",
  Closed: "बंद",
  Pending: "लंबित",

  Civil: "दीवानी",
  Criminal: "फौजदारी",
  Family: "पारिवारिक",

  "Court No. 4": "न्यायालय कक्ष 4",
  "Court Room": "न्यायालय कक्ष",
  "Judge TBD": "न्यायाधीश निर्धारित नहीं",
  "Court TBD": "न्यायालय निर्धारित नहीं",

  "New Client": "नया मुवक्किल",
  Search: "खोजें",
  "Client Name": "मुवक्किल का नाम",
  Mobile: "मोबाइल",
  Email: "ईमेल",
  Status: "स्थिति",
  Actions: "कार्य",
  View: "देखें",
  Edit: "संपादित करें",
  Delete: "हटाएँ",
  "No clients found.": "कोई मुवक्किल नहीं मिला।",
  Completed: "पूर्ण",
  Upcoming: "आगामी",
  "No hearings scheduled.": "कोई सुनवाई निर्धारित नहीं।",
  "New Matter": "नया मामला",
  "Search Matters": "मामलों की खोज करें",

  "Legal Notice": "कानूनी नोटिस",
  Affidavit: "शपथपत्र",
  Vakalatnama: "वकालतनामा",
  "Bail Application": "जमानत आवेदन",
  "Written Statement": "लिखित बयान",
  Reply: "प्रत्युत्तर",
  "Evidence Uploaded": "साक्ष्य अपलोड किया गया",
  "Matter Registered": "मामला पंजीकृत",
  "Notice issued": "नोटिस जारी किया गया",
  "No Remarks": "कोई टिप्पणी नहीं",
  Document: "दस्तावेज़",
  Hearing: "सुनवाई",
  MatterCreated: "मामला पंजीकृत",
};

export function legalText(value?: string) {
  if (!value) return "";
  return i18n.language.startsWith("hi") ? (hiMap[value] ?? value) : value;
}
