import { useQuery } from "@apollo/client";
import { Form, FormInstance, Input, Select } from "antd";
import { useTranslationWithPrefix } from "../../components/useTranslationWithPrefix";
import { AdminGetAllOrgs } from "../../graphql/__generated__/AdminGetAllOrgs";
import { ADMIN_GET_ALL_ORGS } from "../../graphql/__queries__/AdminGetAllOrgs.gql";

/**
 * Values included in the create team form
 */
export type CreateTeamFormValues = {
  name: string;
  organizationId: string;
};

export type CreateTeamProps = {
  /**
   * Form instance that UI will complete.
   */
  form: FormInstance;
  /**
   * Callback to run when form is successfully validated and ready to be
   * submitted.
   */
  onFinish: (values: CreateTeamFormValues) => any;
};

/**
 * Form for creating a new team.
 */
export const CreateTeam = ({ form, onFinish }: CreateTeamProps) => {
  const {
    data: orgData,
    loading: orgDataLoading,
    error: orgDataError,
  } = useQuery<AdminGetAllOrgs>(ADMIN_GET_ALL_ORGS, {
    onCompleted(data) {
      // Org query is cached, but the first time its loaded we need to update
      // the form asynchronously to include the default value.
      form.setFieldsValue({ organizationId: data.organizations[0]?.id });
    },
  });
  const { tp } = useTranslationWithPrefix("admin.team.create");

  if (orgDataError) {
    throw orgDataError;
  }

  return (
    <Form
      preserve={false}
      initialValues={{
        name: "",
        // Default to the first (and probably only) org in the list.
        // On first load this is missing on the first render and will be
        // updated by the query success callback.
        organizationId: orgData?.organizations[0]?.id,
      }}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 14 }}
      form={form}
      onFinish={onFinish}
    >
      <Form.Item
        name="name"
        label={tp("name")}
        rules={[
          {
            required: true,
            message: tp("nameRequired"),
          },
        ]}
      >
        <Input aria-required="true" aria-label={tp("name")} />
      </Form.Item>

      <Form.Item
        rules={[
          {
            required: true,
            message: tp("organizationRequired"),
          },
        ]}
        name="organizationId"
        label={tp("organization")}
      >
        <Select
          loading={orgDataLoading}
          aria-label={tp("organization")}
          aria-required="true"
        >
          {orgData?.organizations.map((org) => (
            <Select.Option key={org.id} value={org.id}>
              {org.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  );
};
