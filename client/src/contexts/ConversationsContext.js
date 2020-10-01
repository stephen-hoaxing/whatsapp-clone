import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { useContacts } from "./ContactsContext";
import { useSocket } from "./SocketContext";

export const ConversationsContext = createContext();

export const useConversations = () => {
  return useContext(ConversationsContext);
};

export const ConversationsProvider = ({ id, children }) => {
  const [conversations, setConversations] = useLocalStorage(
    "conversations",
    []
  );

  const socket = useSocket();

  const [selectedConversationIndex, setSelectedConversationIndex] = useState(0);

  const createConversation = (recipients) => {
    setConversations((previousConversations) => {
      return [...previousConversations, { recipients, messages: [] }];
    });
  };

  const { contacts } = useContacts();

  const arrayEquality = (a, b) => {
    if (a.length !== b.length) return false;
    a.sort();
    b.sort();

    return a.every((element, index) => {
      return element === b[index];
    });
  };

  const addMessageToConversation = useCallback(
    ({ recipients, text, sender }) => {
      setConversations((prev) => {
        let madeChange = false;
        const newMessage = {
          sender,
          text,
        };
        const newConversations = prev.map((conv) => {
          if (arrayEquality(conv.recipients, recipients)) {
            madeChange = true;
            return { ...conv, messages: [...conv.messages, newMessage] };
          }
          return conv;
        });

        if (madeChange) {
          return newConversations;
        } else {
          return [...prev, { recipients, messages: [newMessage] }];
        }
      });
    },
    [setConversations]
  );

  useEffect(() => {
    if (socket == null) return;
    socket.on("receive-message", addMessageToConversation);
    return () => socket.off("receive-message");
  }, [socket, addMessageToConversation]);

  const sendMessage = (recipients, text) => {
    socket.emit("send-message", { recipients, text });
    addMessageToConversation({ recipients, text, sender: id });
  };

  const formattedConversations = conversations.map((conversation, index) => {
    const recipients = conversation.recipients.map((recipient) => {
      const contact = contacts.find((contact) => {
        return contact.id === recipient;
      });
      const name = (contact && contact.name) || recipient;
      return { id: recipient, name };
    });

    const messages = conversation.messages.map((message) => {
      const contact = contacts.find((contact) => {
        return contact.id === message.sender;
      });
      const name = (contact && contact.name) || message.sender;
      const fromMe = id === message.sender;
      return { ...message, senderName: name, fromMe };
    });

    const selected = index === selectedConversationIndex;
    return { ...conversation, messages, recipients, selected };
  });

  const value = {
    conversations: formattedConversations,
    selectedConversation: formattedConversations[selectedConversationIndex],
    selectConversationIndex: setSelectedConversationIndex,
    createConversation,
    sendMessage,
  };

  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
};
