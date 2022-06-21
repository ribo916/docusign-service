const docusign = require("docusign-esign");
const fs = require('fs');

function makeEnvelope(args) {

  let env = new docusign.EnvelopeDefinition();
  env.emailSubject = "DocuSign REPLIT Example";

  // TODO: Clean this crap up
  let doc1 = createHtmlDefinitionDoc('CreditScoreSummary.html');
  doc1.documentId = "1";
  let doc2 = createHtmlDefinitionDoc('Odometer.html');
  doc2.documentId = "2";
  let doc3 = createHtmlDefinitionDoc('AgreementNotToExport.html');
  doc3.documentId = "3";
  let doc4 = createHtmlDefinitionDoc('AgreementToProvideIns.html');
  doc4.documentId = "4";
  let doc5 = createHtmlDefinitionDoc('ConsumerLoan.html');
  doc5.documentId = "5";
  let doc6 = createHtmlDefinitionDoc('DCAP_CO.html');
  doc6.documentId = "6";
  let doc7 = createHtmlDefinitionDoc('FactAct.html');
  doc7.documentId = "7";
  let doc8 = createHtmlDefinitionDoc('Law_Contract.html');
  doc8.documentId = "8";
  let doc9 = createHtmlDefinitionDoc('RetailSpotDelivery.html');
  doc9.documentId = "9";
  let doc10 = createHtmlDefinitionDoc('WA_Payoff_Release.html');
  doc10.documentId = "10";
  let doc11 = createHtmlDefinitionDoc('WA_DMV_LemonLaw.html');
  doc11.documentId = "11";
  let pdoc1 = readPdfDoc("CreditScoreSummary.pdf");
  pdoc1.documentId = "1"; 
  let pdoc2 = readPdfDoc("OdometerStatement.pdf");
  pdoc2.documentId = "2";
  let pdoc3 = readPdfDoc('AgreementNotToExport.pdf');
  pdoc3.documentId = "3";
  let pdoc4 = readPdfDoc('AgreementToProvideIns.pdf');
  pdoc4.documentId = "4";
  let pdoc5 = readPdfDoc('ConsumerLoan.pdf');
  pdoc5.documentId = "5";
  let pdoc6 = readPdfDoc('91581_DCAP_CO.pdf');
  pdoc6.documentId = "6";
  let pdoc7 = readPdfDoc('FactActNotice.pdf');
  pdoc7.documentId = "7";
  let pdoc8 = readPdfDoc('43894_Law_Contract.pdf');
  pdoc8.documentId = "8";
  let pdoc9 = readPdfDoc('RetailSpotDelivery.pdf');
  pdoc9.documentId = "9";
  let pdoc10 = readPdfDoc('85821_WA_Payoff_Release.pdf');
  pdoc10.documentId = "10";
  let pdoc11 = readPdfDoc('88352_WA_DMV_LemonLaw.pdf');
  pdoc11.documentId = "11";

  // Create envelope based on scenario requested
  if (args.scenario == 1) {
    env.documents = [doc1, doc2, doc4, doc8, doc11];
  } else if (args.scenario == 2) {
    env.documents = [pdoc1, pdoc2, pdoc4, pdoc8, pdoc11];    
  } else {
    env.documents = [doc1, doc2, doc4, doc8, doc11, pdoc5];   
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
    anchorString: "Co-Customer Signs X",
    anchorYOffset: "-10",
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

// Read PDF from folder and return document object (with responsive signing)
function readPdfDocAsHtml(filename) {
  let htmlDefinition = new docusign.DocumentHtmlDefinition();
  htmlDefinition.source = "document"; 
  // htmlDefinition.showMobileOptimizedToggle = true;
  // console.log('htmldef = ' + JSON.stringify(htmlDefinition));
  
  const data = fs.readFileSync('pdf/'+filename,{encoding:'base64', flag:'r'});
  let doc = new docusign.Document();
  doc.documentBase64 = data;
  // doc.fileExtension = "pdf";
  doc.name = filename;  
  doc.htmlDefinition = htmlDefinition;

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