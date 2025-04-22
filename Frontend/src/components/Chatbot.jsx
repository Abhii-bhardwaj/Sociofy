import React, { useState, useRef, useEffect } from "react";
import { faqs } from "../lib/faqData.js";
import { axiosInstance } from "../lib/axios.js";

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Hi there! I'm your Sociofy Support Assistant. How can I help you today?",
      sender: "bot",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState([
    "I can't login to my account",
    "How do I create a new post?",
    "How do I reset my password?",
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [userEmail, setUserEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // Check viewport size on mount and when window is resized
  useEffect(() => {
    const checkViewportSize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkViewportSize();
    window.addEventListener("resize", checkViewportSize);
    return () => window.removeEventListener("resize", checkViewportSize);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const submitQueryToBackend = async (query) => {
    try {
      const userId = localStorage.getItem("sociofy_user_id") || null;
      await axiosInstance.post("/support/query", {
        userId,
        question: query,
        email: userEmail || null,
      });
    } catch (error) {
      console.error("Error logging support query:", error);
    }
  };

  const containsInappropriateLanguage = (text) => {
    const inappropriateWords = {
      english: ["damn", "hell", "shit", "fuck", "asshole", "bitch", "bastard"],
      hindi: [
        "bc",
        "mc",
        "behenchod",
        "madarchod",
        "bhosdike",
        "gandu",
        "lodu",
        "chutiya",
      ],
      spanish: ["mierda", "joder", "puta", "coño", "pendejo"],
      french: ["merde", "putain", "connard", "salope"],
    };

    const lowerText = text.toLowerCase();
    for (const language in inappropriateWords) {
      if (
        inappropriateWords[language].some(
          (word) =>
            lowerText.includes(word) ||
            new RegExp(
              `\\b${word}\\b|\\b${word}[\\s.,!?]|[\\s.,!?]${word}\\b`
            ).test(lowerText)
        )
      ) {
        return language;
      }
    }
    return false;
  };

  const generateModerationResponse = (language) => {
    const responses = {
      english:
        "Please keep your language respectful. I'm here to help with Sociofy support questions.",
      hindi:
        "कृपया अपनी भाषा का सम्मान रखें। मैं Sociofy सपोर्ट के सवालों में मदद करने के लिए यहां हूं।",
      spanish:
        "Por favor, mantén un lenguaje respetuoso. Estoy aquí para ayudarte con preguntas sobre Sociofy.",
      french:
        "Veuillez garder un langage respectueux. Je suis là pour vous aider avec les questions concernant Sociofy.",
      default:
        "Please keep your language respectful. I'm here to help with Sociofy support questions.",
    };
    return responses[language] || responses.default;
  };

  const processUserQuery = (query) => {
    setLoading(true);
    submitQueryToBackend(query).catch((err) => {
      console.error("Error submitting query:", err);
    });

    const detectedLanguage = containsInappropriateLanguage(query);
    if (detectedLanguage) {
      setTimeout(() => {
        setMessages((prevMessages) => [
          ...prevMessages,
          { id: prevMessages.length + 1, text: query, sender: "user" },
          {
            id: prevMessages.length + 2,
            text: generateModerationResponse(detectedLanguage),
            sender: "bot",
          },
        ]);
        setLoading(false);
      }, 600);
      return;
    }

    setTimeout(() => {
      const lowerCaseQuery = query.toLowerCase();
      const matchedFaq = faqs.find(
        (faq) =>
          faq.question.toLowerCase().includes(lowerCaseQuery) ||
          lowerCaseQuery.includes(
            faq.question.toLowerCase().replace(/[?']/g, "")
          )
      );

      let botResponse;
      if (matchedFaq) {
        botResponse = matchedFaq.answer;
      } else {
        if (
          lowerCaseQuery.includes("hello") ||
          lowerCaseQuery.includes("hi") ||
          lowerCaseQuery.includes("hey")
        ) {
          botResponse = "Hello! How can I help you with Sociofy today?";
        } else if (lowerCaseQuery.includes("thank")) {
          botResponse =
            "You're welcome! Is there anything else I can help you with?";
        } else if (
          lowerCaseQuery.includes("bye") ||
          lowerCaseQuery.includes("goodbye")
        ) {
          botResponse =
            "Goodbye! Feel free to come back if you have more questions.";
        } else {
          botResponse =
            "I'm not sure I understand. Could you try rephrasing your question? Or you can email our support team at support@sociofy.work.gd for more help.";
          const newSuggestions = faqs
            .filter((faq) =>
              faq.question.toLowerCase().includes(lowerCaseQuery.split(" ")[0])
            )
            .slice(0, 3)
            .map((faq) => faq.question);
          if (newSuggestions.length > 0) {
            setSuggestedQuestions(newSuggestions);
          }
        }
      }

      setMessages((prevMessages) => [
        ...prevMessages,
        { id: prevMessages.length + 1, text: query, sender: "user" },
        { id: prevMessages.length + 2, text: botResponse, sender: "bot" },
      ]);
      setLoading(false);
    }, 600);
  };

  const handleRequestFollowUp = () => {
    setShowEmailInput(true);
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: prevMessages.length + 1,
        text: "I'd like a follow-up from support",
        sender: "user",
      },
      {
        id: prevMessages.length + 2,
        text: "Please provide your email address and we'll get back to you as soon as possible.",
        sender: "bot",
      },
    ]);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (userEmail.trim()) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          text: userEmail,
          sender: "user",
        },
        {
          id: prevMessages.length + 2,
          text: "Thank you! Our support team will contact you at this email address shortly.",
          sender: "bot",
        },
      ]);
      setShowEmailInput(false);
      submitQueryToBackend("Follow-up requested").catch((err) => {
        console.error("Error submitting follow-up request:", err);
      });
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      processUserQuery(inputValue);
      setInputValue("");
    }
  };

  const handleSuggestedQuestion = (question) => {
    processUserQuery(question);
    const randomFaqs = [...faqs]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((faq) => faq.question);
    setSuggestedQuestions(randomFaqs);
  };

  const handleContactSupport = () => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: prevMessages.length + 1,
        text: "I'd like to contact human support",
        sender: "user",
      },
      {
        id: prevMessages.length + 2,
        text: "You can reach our support team at support@sociofy.work.gd. Please include your username and a detailed description of your issue.",
        sender: "bot",
      },
    ]);
  };

  return (
    <div className="flex flex-col w-full h-full max-h-screen bg-base-100">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto flex flex-col h-full">
        <div className="flex flex-col h-full bg-base-100 shadow-xl rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-content p-3 sm:p-4 flex items-center">
            <div className="avatar">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary-focus flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-2 sm:ml-3">
              <h3 className="text-base sm:text-lg font-bold">
                Sociofy Support
              </h3>
              <p className="text-xs sm:text-sm opacity-80">
                Usually replies instantly
              </p>
            </div>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 min-h-0 max-h-[calc(100vh-200px)]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat ${
                  message.sender === "user" ? "chat-end" : "chat-start"
                }`}>
                <div
                  className={`chat-bubble ${
                    message.sender === "user"
                      ? "chat-bubble-primary"
                      : "chat-bubble-neutral"
                  } max-w-[70%] sm:max-w-xs md:max-w-sm text-xs sm:text-sm`}>
                  {message.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat chat-start">
                <div className="chat-bubble chat-bubble-neutral flex space-x-1">
                  <span className="loading loading-dots loading-xs sm:loading-sm"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested questions */}
          {suggestedQuestions.length > 0 && (
            <div className="p-2 sm:p-3 bg-base-200">
              <p className="text-xs sm:text-sm text-base-content/60 mb-1 sm:mb-2 px-1">
                Suggested questions:
              </p>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="btn btn-xs sm:btn-sm btn-outline text-left text-wrap text-xs sm:text-sm">
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Contact support buttons */}
          <div className="px-3 sm:px-4 py-2 bg-base-200 flex flex-col sm:flex-row justify-center gap-1 sm:gap-2">
            <button
              onClick={handleContactSupport}
              className="btn btn-xs sm:btn-sm btn-ghost text-primary text-xs sm:text-sm">
              Contact Human Support
            </button>
            <button
              onClick={handleRequestFollowUp}
              className="btn btn-xs sm:btn-sm btn-ghost text-primary text-xs sm:text-sm">
              Request Follow-up
            </button>
          </div>

          {/* Email input form */}
          {showEmailInput && (
            <form
              onSubmit={handleEmailSubmit}
              className="p-3 sm:p-4 pb-4 sm:pb-6 border-t flex flex-row items-center gap-1 sm:gap-2 w-full mb-4 sm:mb-0">
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Your email address"
                className="input input-bordered flex-1 min-h-[48px] sm:min-h-[56px] p-2 sm:p-3 text-sm sm:text-base"
                required
              />
              <button
                type="submit"
                className="btn btn-primary btn-md sm:btn-lg min-w-[48px] sm:min-w-[56px]">
                Submit
              </button>
            </form>
          )}

          {/* Message input area */}
          <form
            onSubmit={handleSend}
            className="p-3 sm:p-4 pb-4 sm:pb-6 border-t flex flex-row items-center gap-1 sm:gap-2 w-full mb-12 sm:mb-0">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question..."
              className="input input-bordered flex-1 min-h-[48px] sm:min-h-[56px] p-2 sm:p-3 text-sm sm:text-base"
            />
            <button
              type="submit"
              className="btn btn-primary btn-md sm:btn-lg min-w-[48px] sm:min-w-[56px]"
              disabled={!inputValue.trim() || loading}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 sm:h-6 sm:w-6"
                viewBox="0 0 20 20"
                fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
