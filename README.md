# Civilify - Legal AI Assistant

**Civilify** is an AI-powered legal assistant designed to help users assess the plausibility of their legal issues and determine if they have a viable case to pursue. Powered by OpenAI's GPT-4.0, Civilify offers insightful legal advice, generates sample documents, and helps users navigate their legal concerns in a conversational manner.

## Features
- **AI-Powered Legal Assistance**  
  Civilify uses OpenAI's GPT-4.0 to provide accurate and insightful legal assessments based on user input. The system guides users in determining whether their legal issue is worth pursuing.

- **Legal Case Assessment**  
  Villy, the chatbot, evaluates user input to determine if there is a plausible case that can be built around the legal concern. Civilify supports a wide range of legal topics and provides tailored responses.

- **Legal Insights and Advice**  
  Civilify offers general and in-depth legal insights after evaluating user input. The advice is not conclusive but helps guide users on whether to proceed with pursuing a case.

- **Sample Legal Document Generation**  
  Once the case has been assessed, Civilify can generate sample legal documents, such as letters to attorneys. Documents are only created after the assessment is completed to ensure they are relevant to the user's situation.

- **Evidence and Case Summaries**  
  Civilify can generate case summaries or evidence checklists for users who are deep into the conversation and need assistance in structuring their case.

- **Freeform Chat Experience**  
  Users interact with Villy, the AI chatbot, in a conversational format. Villy suggests replies that can be toggled on or off by the user, allowing for an interactive and flexible experience.

- **No Legal Professional Referrals**  
  Civilify does not refer users to legal professionals. It provides insights and advice based on its AI assessments but does not act as a marketplace for legal services.

## Technologies
- **Backend:** OpenAI's GPT-4.0 for legal insights
- **Frontend:** Chatbot-based UI for seamless user interaction
- **Security:** Data encryption for privacy and confidentiality

## Getting Started

### Prerequisites
Before running Civilify, ensure you have the following tools installed:

- **Java JDK 21
- **Flask (or another web framework)**
- **OpenAI API key** (for legal insights)

### Installation
Clone this repository:

```bash
git clone https://github.com/yourusername/civilify.git
cd civilify
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### Running the Application
To run the application locally, use the following command:

#### For Backend ####
```bash
open new terminal
cd backend
mvn spring-boot:run
```

#### For Frontend ####
```bash
open new terminal
cd frontend
npm i (if not yet)
npm run dev
```

Visit `http://localhost:5000` in your browser to start interacting with Villy, the chatbot.

## Usage
1. **Start a Conversation**  
   Begin by typing your legal issue in the chat window. Villy will guide you through the conversation, evaluating the plausibility of your case.

2. **Receive Legal Insights**  
   After the evaluation, Civilify will offer legal insights based on the type of case. The advice will be presented in a clear and structured manner.

3. **Generate Sample Documents**  
   If the legal assessment indicates that you have a plausible case, Villy will offer to generate a sample legal document (e.g., a letter to an attorney).

4. **View Evidence and Case Summaries**  
   If needed, you can request a case summary or checklist of evidence to help organize your thoughts before proceeding further.

## Contributing
Contributions are welcome! If you'd like to help improve Civilify, feel free to fork the repository, make changes, and submit a pull request.

### Bug Reports and Feature Requests
Please open an issue on GitHub to report bugs or suggest new features.

## Acknowledgments
- **OpenAI GPT-4.0** for providing the legal insights and case assessment capabilities.
- **OpenAI** for contributing to the development of the AI chatbot (Villy).
