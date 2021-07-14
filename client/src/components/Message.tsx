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

// Type guard for ArgsProps content
function isArgsProps(obj: any): obj is ArgsProps {
  if (!obj) {
    return false;
  }
  // because this is an object with a hard-coded key ->
  // eslint-disable-next-line no-prototype-builtins
  return obj.hasOwnProperty("content");
}

const createMessage =
  (type: Message) =>
  (
    content: JointContent,
    duration?: number | (() => void),
    onClose?: ConfigOnClose
  ) => {
    const newContent = isArgsProps(content)
      ? { style, ...content }
      : { style, content };

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
