const docusign = require("docusign-esign");
const fs = require('fs');

function makeEnvelope(args) {

  let env = new docusign.EnvelopeDefinition();
  env.emailSubject = "DocuSign REPLIT Example";

  let doc1, doc2, doc3, doc4, doc5, doc6, doc7, doc8, doc9, doc10, doc11;
  if (args.scenario == 1) {
    doc1 = createHtmlDefinitionDoc('CreditScoreSummary.html');
    doc1.documentId = "1";
    doc2 = createHtmlDefinitionDoc('Odometer.html');
    doc2.documentId = "2";
    doc3 = createHtmlDefinitionDoc('AgreementNotToExport.html');
    doc3.documentId = "3";
    doc4 = createHtmlDefinitionDoc('AgreementToProvideIns.html');
    doc4.documentId = "4";
    doc5 = createHtmlDefinitionDoc('ConsumerLoan.html');
    doc5.documentId = "5";
    doc6 = createHtmlDefinitionDoc('DCAP_CO.html');
    doc6.documentId = "6";
    doc7 = createHtmlDefinitionDoc('FactAct.html');
    doc7.documentId = "7";
    doc8 = createHtmlDefinitionDoc('Law_Contract.html');
    doc8.documentId = "8";
    doc9 = createHtmlDefinitionDoc('RetailSpotDelivery.html');
    doc9.documentId = "9";
    doc10 = createHtmlDefinitionDoc('WA_Payoff_Release.html');
    doc10.documentId = "10";
    doc11 = createHtmlDefinitionDoc('WA_DMV_LemonLaw.html');
    doc11.documentId = "11";
    env.documents = [doc1, doc2, doc3, doc4, doc5, doc6, doc7, doc8, doc9, doc10, doc11];
  } else if (args.scenario == 2) {
    doc1 = readPdfDoc("CreditScoreSummary.pdf");
    doc1.documentId = "1"; 
    doc2 = readPdfDoc("OdometerStatement.pdf");
    doc2.documentId = "2";
    doc3 = readPdfDoc('AgreementNotToExport.pdf');
    doc3.documentId = "3";
    doc4 = readPdfDoc('AgreementToProvideIns.pdf');
    doc4.documentId = "4";
    doc5 = readPdfDoc('ConsumerLoan.pdf');
    doc5.documentId = "5";
    doc6 = readPdfDoc('91581_DCAP_CO.pdf');
    doc6.documentId = "6";
    doc7 = readPdfDoc('FactActNotice.pdf');
    doc7.documentId = "7";
    doc8 = readPdfDoc('43894_Law_Contract.pdf');
    doc8.documentId = "8";
    doc9 = readPdfDoc('RetailSpotDelivery.pdf');
    doc9.documentId = "9";
    doc10 = readPdfDoc('85821_WA_Payoff_Release.pdf');
    doc10.documentId = "10";
    doc11 = readPdfDoc('88352_WA_DMV_LemonLaw.pdf');
    doc11.documentId = "11";
    
    env.documents = [doc1, doc2, doc3, doc4, doc5, doc6, doc7, doc8, doc9, doc10, doc11];    
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
  eventNotification.url = 'https://webhook.site/16c560e6-92c5-431f-8b0c-47c89865e475';
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