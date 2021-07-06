import React from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Form, Input, FormInstance, message } from "antd";
import * as account from "../../services/account";

export type CreateUserProps = {
  /**
   * Form object that will be filled out by the UI elements.
   */
  form: FormInstance<account.CreateUserFormValues>;
};

/**
 * Form to create a new user.
 *
 * Due to the way the backend API is structured, only a limited amount of info
 * can be passed in the create user request. Roles and teams cannot be set here
 * and required a subsequent request.
 *
 * This form will create a user using the basic initial request, then redirect
 * to the Edit User page to set details.
 */
export const CreateUser = ({ form }: CreateUserProps) => {
  const { t } = useTranslation();
  const history = useHistory();

  /**
   * Create a new user and handle success / error conditions.
   */
  const saveNewUser = async (values: account.CreateUserFormValues) => {
    try {
      const id = await account.createUser(values);
      try {
        await account.requestVerifyUser(values.email);
      } catch (e) {
        message.warn(e.message);
      }
      history.push(`/admin/users/${id}`);
    } catch (e) {
      message.error(e.message);
    }
  };

  return (
    <Form
      form={form}
      preserve={false}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 14 }}
      onFinish={saveNewUser}
    >
      <Form.Item
        name="first_name"
        label={t("admin.user.fields.firstName")}
        rules={[
          {
            required: true,
            message: t("admin.user.validation.firstNameRequired"),
          },
        ]}
      >
        <Input
          allowClear
          aria-label={t("admin.user.fields.firstName")}
          aria-required="true"
        />
      </Form.Item>

      <Form.Item
        name="last_name"
        label={t("admin.user.fields.lastName")}
        rules={[
          {
            required: true,
            message: t("admin.user.validation.lastNameRequired"),
          },
        ]}
      >
        <Input
          allowClear
          aria-label={t("admin.user.fields.lastName")}
          aria-required="true"
        />
      </Form.Item>

      <Form.Item
        name="email"
        label={t("admin.user.fields.email")}
        rules={[
          {
            type: "email",
            message: t("admin.user.validation.email"),
          },
          {
            required: true,
            message: t("admin.user.validation.lastNameRequired"),
          },
        ]}
      >
        <Input
          allowClear
          aria-label={t("admin.user.fields.email")}
          aria-required="true"
        />
      </Form.Item>
    </Form>
  );
};
