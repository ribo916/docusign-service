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
  
  // Construct Signer Object
  let signer1 = docusign.Signer.constructFromObject({
    email: args.signerEmail,
    name: args.signerName,
    recipientId: args.recipientId,
    clientUserId: args.clientUserId,    
    routingOrder: "1",
  });

  // JSON tags for HTML signature injection
  let signHereHtml = docusign.SignHere.constructFromObject({
    stampType: "signature",
    name: "SignHere",
    tabLabel: "signatureTab",
    scaleValue: "1",
    optional: "false",
    documentId: "1",
    recipientId: "1"
  });

  // Anchor tags for PDF example
  let signHerePdf = docusign.SignHere.constructFromObject({
    anchorString: "Authorized Dealership Representative",
    anchorYOffset: "20",
    anchorUnits: "pixels",
    anchorXOffset: "0"
  });

  let signer1Tabs;
  // Don't apply JSON signer object if no HTML
  if (args.scenario == 2) {
    signer1Tabs = docusign.Tabs.constructFromObject({
    signHereTabs: [signHerePdf],
    });      
  } else {
    signer1Tabs = docusign.Tabs.constructFromObject({
    signHereTabs: [signHereHtml, signHerePdf],
    });  
  }
  
  signer1.tabs = signer1Tabs;

  let recipients = docusign.Recipients.constructFromObject({
    signers: [signer1]
  });

  // Configure webhook
  let eventNotification = new docusign.EventNotification();
  // Set up the endpoint URL to call (it must be using HTTPS and at least TLS1.1 or higher)
  eventNotification.url = 'https://webhook.site/2195d8cf-1a7f-4d6a-91a8-f0c54ea62bf2';
  // DocuSign will retry on failure if this is set
  eventNotification.requireAcknowledgment = 'false';
  // This would send the documents together with the event to the endpoint
  eventNotification.includeDocuments = 'false';
  // Allow you to see this in the DocuSign Admin Connect logs section
  eventNotification.loggingEnabled = 'false';
  let envelopeEvents = [];
  // In this case we only add a single envelope event, when the envelope is completed. You can also add events for recipients
  let envelopeEvent = new docusign.EnvelopeEvent();
  envelopeEvent.envelopeEventStatusCode = 'completed'; 
  envelopeEvent.includeDocuments = 'false';
  envelopeEvents.push(envelopeEvent);   
  eventNotification.envelopeEvents = envelopeEvents;

  env.eventNotification = eventNotification;
  env.recipients = recipients;
  env.status = args.status;
  return env;
}

// Read PDF from folder and return document object
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

module.exports = { makeEnvelope };