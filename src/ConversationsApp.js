import React from "react";
import { Badge, Icon, Layout, Typography } from "antd";
import { Client as ConvoClient } from "@twilio/conversations";
import axios from "axios";

// import { Client as ConvoClient, Conversation as TwilioConversation, Paginator, Message, 
// Configuration, ConversationServices, ConversationLinks, SendMediaOptions  } from "@twilio/conversations"
import dotenv from 'dotenv'

import "./assets/Conversation.css";
import "./assets/ConversationSection.css";
import { ReactComponent as Logo } from "./assets/twilio-mark-red.svg";

import Conversation from "./Conversation";
import LoginPage from "./LoginPage";
import { ConversationsList } from "./ConversationsList";
import { HeaderItem } from "./HeaderItem";
//import { config } from "../config";

const { Content, Sider, Header } = Layout;
const { Text } = Typography;

dotenv.config()

class ConversationsApp extends React.Component {
  constructor(props) {
    super(props);

    const name = localStorage.getItem("name") || "";
    const loggedIn = name !== "";

    this.state = {
      name,
      loggedIn,
      token: null,
      statusString: null,
      conversationsReady: false,
      conversations: [],
      selectedConversationSid: null,
      newMessage: ""
    };
  }

  componentDidMount = () => {
    if (this.state.loggedIn) {
      this.getToken();
      this.setState({ statusString: "Fetching credentials…" });
    }
  };

  logIn = (name) => {
    if (name !== "") {
      localStorage.setItem("name", name);
      this.setState({ name, loggedIn: true }, this.getToken);
    }
  };

  logOut = (event) => {
    if (event) {
      event.preventDefault();
    }

    this.setState({
      name: "",
      loggedIn: false,
      token: "",
      conversationsReady: false,
      messages: [],
      newMessage: "",
      conversations: []
    });

    localStorage.removeItem("name");
    this.conversationsClient.shutdown();
  };

  getToken = async () => {
    // Paste your unique Chat token function
    const requestAddress = process.env.REACT_APP_ACCESS_TOKEN_SERVICE_URL;
    if (!requestAddress) {
      return Promise.reject(
        "REACT_APP_ACCESS_TOKEN_SERVICE_URL is not configured, cannot login"
      );
    }

    try {
      const response = await axios.get(requestAddress, {
        params: { identity: 'davauj2', password: 'p@55w0Rd' },
      });
      this.setState({ token: response.data }, this.initConversationsCallback);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return Promise.reject(error.response.data ?? "Authentication error.");
      }
      return Promise.reject(`ERROR received from ${requestAddress}: ${error}\n`);
    }
    console.log("this.State ---- getToken()", this.state.token)
  };

  initConversationsCallback = async () => {
    console.log("this.State ---- initConversationsCallback()", this.state)

    this.conversationsClient = new ConvoClient(this.state.token);
    this.setState({ statusString: "Connecting to Twilio…" });

    this.conversationsClient.on("connectionStateChanged", (state) => {
      if (state === "connecting")
        this.setState({
          statusString: "Connecting to Twilio…",
          status: "default"
        });
      if (state === "connected") {
        this.setState({
          statusString: "You are connected.",
          status: "success"
        });
        console.log("this.State (connected)", this.state)

      }
      if (state === "disconnecting")
        this.setState({
          statusString: "Disconnecting from Twilio…",
          conversationsReady: false,
          status: "default"
        });
      if (state === "disconnected")
        this.setState({
          statusString: "Disconnected.",
          conversationsReady: false,
          status: "warning"
        });
      if (state === "denied")
        this.setState({
          statusString: "Failed to connect.",
          conversationsReady: false,
          status: "error"
        });
    });
    this.conversationsClient.on("conversationJoined", (conversation) => {
      this.setState({
        conversations: [...this.state.conversations, conversation]
      });
    });
    this.conversationsClient.on("conversationLeft", (thisConversation) => {
      this.setState({
        conversations: [
          ...this.state.conversations.filter((it) => it !== thisConversation)
        ]
      });
    });
    this.conversationsClient.on("conversationAdded", (conversation) => {
      console.log(`${new Date().toISOString()} ConversationsApp - HandleConversationAdded ${conversation?.sid}`)
      console.log(`${new Date().toISOString()} ConversationsApp - HandleConversationAdded ${JSON.stringify(conversation?.attributes)}`)
    });

    this.conversationsClient.on("conversationUpdated", (data) => {
      console.log(`${new Date().toISOString()} ConversationsApp - HandleConversationUpdated: ${JSON.stringify(data?.conversation.attributes)}`);
      console.log(`${new Date().toISOString()} ConversationsApp - HandleConversationUpdated: ${data?.reasons}`);

    });
  }
  render() {
    const { conversations, selectedConversationSid, status } = this.state;
    const selectedConversation = conversations.find(
      (it) => it.sid === selectedConversationSid
    );

    let conversationContent;
    if (selectedConversation) {
      conversationContent = (
        <Conversation
          conversationProxy={selectedConversation}
          myIdentity={this.state.name}
        />
      );
    } else if (status !== "success") {
      conversationContent = "Loading your conversation!";
    } else {
      conversationContent = "";
    }

    if (this.state.loggedIn) {
      return (
        <div className="conversations-window-wrapper">
          <Layout className="conversations-window-container">
            <Header
              style={{ display: "flex", alignItems: "center", padding: 0 }}
            >
              <div
                style={{
                  maxWidth: "250px",
                  width: "100%",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <HeaderItem style={{ paddingRight: "0", display: "flex" }}>
                  <Logo />
                </HeaderItem>
                <HeaderItem>
                  <Text strong style={{ color: "white" }}>
                    MyConversations
                  </Text>
                </HeaderItem>
              </div>
              <div style={{ display: "flex", width: "100%" }}>
                <HeaderItem>
                  <Text strong style={{ color: "white" }}>
                    {selectedConversation &&
                      (selectedConversation.friendlyName ||
                        selectedConversation.sid)}
                  </Text>
                </HeaderItem>
                <HeaderItem style={{ float: "right", marginLeft: "auto" }}>
                  <span
                    style={{ color: "white" }}
                  >{` ${this.state.statusString}`}</span>
                  <Badge
                    dot={true}
                    status={this.state.status}
                    style={{ marginLeft: "1em" }}
                  />
                </HeaderItem>
                <HeaderItem>
                  <Icon
                    type="poweroff"
                    onClick={this.logOut}
                    style={{
                      color: "white",
                      fontSize: "20px",
                      marginLeft: "auto"
                    }}
                  />
                </HeaderItem>
              </div>
            </Header>
            <Layout>
              <Sider theme={"light"} width={250}>
                <ConversationsList
                  conversations={conversations}
                  selectedConversationSid={selectedConversationSid}
                  onConversationClick={(item) => {
                    this.setState({ selectedConversationSid: item.sid });
                  }}
                />
              </Sider>
              <Content className="conversation-section">
                <div id="SelectedConversation">{conversationContent}</div>
              </Content>
            </Layout>
          </Layout>
        </div>
      );
    }

    return <LoginPage onSubmit={this.logIn} />;
  }
}

export default ConversationsApp;
