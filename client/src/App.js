import React from "react";
import "./App.css";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import useLocalStorage from "./hooks/useLocalStorage";
import { ContactsProvider } from "./contexts/ContactsContext";
import { ConversationsProvider } from "./contexts/ConversationsContext";
import { SocketProvider } from "./contexts/SocketContext";

function App() {
  const [id, setId] = useLocalStorage("id");
  const dashboard = (
    <SocketProvider id={id}>
      <ContactsProvider>
        <ConversationsProvider id={id}>
          <Dashboard id={id} />
        </ConversationsProvider>
      </ContactsProvider>
    </SocketProvider>
  );
  return <>{id ? dashboard : <Login onIdSubmit={setId} />}</>;
}

export default App;
