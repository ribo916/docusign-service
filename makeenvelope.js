const docusign = require("docusign-esign");
const fs = require('fs');

function makeEnvelope(args) {

  let env = new docusign.EnvelopeDefinition();
  env.emailSubject = "DocuSign REPLIT Example";

  let doc1, doc2, doc3, doc4;
  
  if (args.scenario == 1) {
    doc1 = createHtmlDefinitionDoc('CreditScoreSummary.html');
    doc1.documentId = "1";
    doc2 = createHtmlDefinitionDoc('Odometer.html');
    doc2.documentId = "2";
    env.documents = [doc1, doc2];
  } else if (args.scenario == 2) {
    doc1 = readPdfDoc("WeOwe.pdf");
    doc1.documentId = "1"; 
    doc2 = readPdfDoc("W9.pdf");
    doc2.documentId = "2";
    env.documents = [doc1, doc2];    
  } else {
    doc1 = createHtmlDefinitionDoc('CreditScoreSummary.html');
    doc1.documentId = "1";
    doc2 = createHtmlDefinitionDoc('Odometer.html');
    doc2.documentId = "2";
    doc3 = readPdfDoc("WeOwe.pdf");
    doc3.documentId = "3"; 
    doc4 = readPdfDoc("W9.pdf");
    doc4.documentId = "4";
    env.documents = [doc1, doc2, doc3, doc4];   
  }
  
  // Construct Signer
  let signer1 = docusign.Signer.constructFromObject({
    email: args.signerEmail,
    name: args.signerName,
    recipientId: args.recipientId,
    clientUserId: args.clientUserId,    
    routingOrder: "1",
  });

  // JSON tags for HTML signature injection
  // NOTE: Having this requires you to send an HTML with a signature tab. If not, remove it from the signer1Tabs below.
  let signHere1 = docusign.SignHere.constructFromObject({
    stampType: "signature",
    name: "SignHere",
    tabLabel: "signatureTab",
    scaleValue: "1",
    optional: "false",
    documentId: "1",
    recipientId: "1"
  });

  // Anchor tags for PDF example
  let signHere2 = docusign.SignHere.constructFromObject({
    anchorString: "Authorized Dealership Representative",
    anchorYOffset: "20",
    anchorUnits: "pixels",
    anchorXOffset: "0"
  });

  let signer1Tabs;
  // Remove the JSON signing if no HTML is sent
  if (args.scenario == 2) {
    signer1Tabs = docusign.Tabs.constructFromObject({
    signHereTabs: [signHere2],
    });      
  } else {
    signer1Tabs = docusign.Tabs.constructFromObject({
    signHereTabs: [signHere1, signHere2],
    });  
  }
  
  signer1.tabs = signer1Tabs;

  let recipients = docusign.Recipients.constructFromObject({
    signers: [signer1]
  });

  env.recipients = recipients;
  env.status = args.status;
  return env;
}

// Read PDF from folder
function readPdfDoc(filename) {
  const data = fs.readFileSync('pdf/'+filename,{encoding:'base64', flag:'r'});
  let doc = new docusign.Document();
  doc.documentBase64 = data;
  doc.fileExtension = "pdf";
  doc.name = filename; // + ".pdf"; 
  return doc;
}

// Create HTML to be sent Responsive
function createHtmlDefinitionDoc(docName) {
  let doc = new docusign.Document();
  let htmlDef = new docusign.DocumentHtmlDefinition();  
  htmlDef.source = readFileUtf8(docName);
  doc.htmlDefinition = htmlDef; 
  doc.name = docName;   
  return doc;
}
// TODO: The synchronous file read is impacting creation time
function readFileUtf8(filename) {  
  const data = fs.readFileSync('html/'+filename,{encoding:'utf8', flag:'r'});
  return data;
}

// Create HTML as Base64 (converted to PDF in DS)
function createHtmlBase64Doc(docName) {
  let doc = new docusign.Document();  
  let docb64 = readFileBase64(docName);
  doc.documentBase64 = docb64; 
  doc.fileExtension = "html";  
  doc.name = docName;  
  return doc;
}
// TODO: The synchronous file read is impacting creation time
function readFileBase64(filename) {  
  const data = fs.readFileSync('html/'+filename,{encoding:'base64', flag:'r'});
  return data;
}

// LEGACY - Create PDF to be sent non-Responsive
function createBasicPdfDoc(name, data) {
  let doc = new docusign.Document();
  doc.documentBase64 = data;
  doc.fileExtension = "pdf";
  doc.name = "Normal.pdf"; 
  return doc;
}

// LEGACY - Create PDF to be sent Responsive
function createResponsivePdfDoc(name, data) {
  let doc = new docusign.Document();
  let htmlDef = new docusign.DocumentHtmlDefinition();
  htmlDef.source = "document";
  htmlDef.showMobileOptimizedToggle = "true",
  doc.htmlDefinition = htmlDef; 
  doc.documentBase64 = data;
  doc.name = name; 
  return doc;
}

module.exports = { makeEnvelope };