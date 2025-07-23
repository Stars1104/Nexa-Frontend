// Test file to demonstrate the file attachment functionality in CampaignDetail component

// Example campaign data with different attachment scenarios

// Scenario 1: Single attachment (string)
const campaignWithSingleAttachment = {
  id: 1,
  title: "Campanha com Anexo Único",
  description: "Uma campanha com apenas um arquivo anexado",
  attach_file: "/uploads/document.pdf"
};

// Scenario 2: Multiple attachments (array) - 3 or fewer files
const campaignWithFewAttachments = {
  id: 2,
  title: "Campanha com Poucos Anexos",
  description: "Uma campanha com 2-3 arquivos anexados",
  attachments: [
    {
      name: "briefing.pdf",
      size: 1024000, // 1MB
      url: "/uploads/briefing.pdf"
    },
    {
      name: "logo.png",
      size: 512000, // 512KB
      url: "/uploads/logo.png"
    },
    {
      name: "requirements.docx",
      size: 256000, // 256KB
      url: "/uploads/requirements.docx"
    }
  ]
};

// Scenario 3: Multiple attachments (array) - more than 3 files (uses carousel)
const campaignWithManyAttachments = {
  id: 3,
  title: "Campanha com Muitos Anexos",
  description: "Uma campanha com mais de 3 arquivos anexados",
  attachments: [
    {
      name: "briefing.pdf",
      size: 1024000,
      url: "/uploads/briefing.pdf"
    },
    {
      name: "logo.png",
      size: 512000,
      url: "/uploads/logo.png"
    },
    {
      name: "requirements.docx",
      size: 256000,
      url: "/uploads/requirements.docx"
    },
    {
      name: "brand-guidelines.pdf",
      size: 2048000,
      url: "/uploads/brand-guidelines.pdf"
    },
    {
      name: "sample-content.jpg",
      size: 768000,
      url: "/uploads/sample-content.jpg"
    },
    {
      name: "contract-template.docx",
      size: 128000,
      url: "/uploads/contract-template.docx"
    }
  ]
};

// Scenario 4: No attachments
const campaignWithoutAttachments = {
  id: 4,
  title: "Campanha sem Anexos",
  description: "Uma campanha sem arquivos anexados"
};

// Expected behavior:
// - Single attachment: Shows as a simple card with file icon, name, and action buttons
// - Few attachments (≤3): Shows as a list of cards, each with file details
// - Many attachments (>3): Shows as a carousel with navigation arrows
// - No attachments: Section is hidden completely

module.exports = {
  campaignWithSingleAttachment,
  campaignWithFewAttachments,
  campaignWithManyAttachments,
  campaignWithoutAttachments
}; 