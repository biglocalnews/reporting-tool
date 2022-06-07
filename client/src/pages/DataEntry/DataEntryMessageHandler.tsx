import {
  messageError,
  messageLoading,
  messageSuccess,
} from "../../components/Message";

export const formMessageHandler = ({
  isEditMode = false,
  isSuccess = false,
  isLoading = false,
  messageKey = "",
  errorMessage = "",
}) => {
  const messageText = isEditMode ? `updated` : `new`;

  if (errorMessage) {
    return messageError({
      content: `Oh, no! Something went wrong. ${errorMessage}.`,
      key: messageKey,
    });
  }

  if (isLoading)
    return messageLoading({
      content: `Saving ${messageText} record...`,
      key: messageKey,
    });

  if (isSuccess)
    return messageSuccess({
      content: `Success! Your ${messageText} record has been saved.`,
    });
};
