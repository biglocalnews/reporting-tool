import { CSSProperties, ReactNode } from "react";
import { message } from "antd";
import { ArgsProps } from "antd/lib/message";
import { ConfigOnClose } from "antd/lib/message";

/**
 * Default configuration for messages
 */
message.config({
  duration: 6, // seconds
  top: 50,
});

/**
 * Default style for messages
 */
const style: CSSProperties = {
  width: "60vw",
  margin: "0 auto",
};

type Message = "info" | "success" | "error" | "warning" | "loading";

type ConfigContent = ReactNode | string;
type JointContent = ConfigContent | ArgsProps;

const createMessage = (type: Message) => (
  content: JointContent,
  duration?: number | (() => void) | undefined,
  onClose?: ConfigOnClose | undefined
) => {
  /* cast content to object */
  const contentPropObject = content as Record<string, unknown>;
  /* check if value passed is a string and set the content for the message
   */
  const newContent =
    typeof content === "string"
      ? { style, content }
      : { style, ...contentPropObject };

  return message[type](newContent, duration, onClose);
};

const messageInfo = createMessage("info");
const messageLoading = createMessage("loading");
const messageError = createMessage("error");
const messageSuccess = createMessage("success");
const messageWarning = createMessage("warning");
const messageOpen = message.open;
const messageConfig = message.config;
const messageDestroy = message.destroy;

export {
  messageInfo,
  messageLoading,
  messageError,
  messageSuccess,
  messageWarning,
  messageOpen,
  messageConfig,
  messageDestroy,
};
