import { useApolloClient } from "@apollo/client";
import {
  Alert,
  Col,
  Form,
  FormInstance,
  Input,
  message,
  Row,
  Select,
  Typography,
} from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Loading } from "../../components/Loading/Loading";
import { useQueryWithErrorHandling } from "../../graphql/hooks/useQueryWithErrorHandling";
import {
  AdminCreateProgram,
  AdminCreateProgramVariables,
} from "../../graphql/__generated__/AdminCreateProgram";
import { AdminGetAllPrograms } from "../../graphql/__generated__/AdminGetAllPrograms";
import { AdminGetAllTeams } from "../../graphql/__generated__/AdminGetAllTeams";
import {
  AdminGetProgram,
  AdminGetProgramVariables,
} from "../../graphql/__generated__/AdminGetProgram";
import { CreateProgramInput, ReportingPeriodType } from "../../graphql/__generated__/globalTypes";
import { ADMIN_CREATE_PROGRAM } from "../../graphql/__mutations__/AdminCreateProgram.gql";
import { ADMIN_GET_ALL_PROGRAMS } from "../../graphql/__queries__/AdminGetAllPrograms.gql";
import { ADMIN_GET_ALL_TEAMS } from "../../graphql/__queries__/AdminGetAllTeams.gql";
import { ADMIN_GET_PROGRAM } from "../../graphql/__queries__/AdminGetProgram.gql";

/**
 * Values set by the UI form.
 */
export type CreateProgramFormValues = {
  name: string;
  team: string;
  basedOn?: string;
  reportingPeriodType: ReportingPeriodType;
};

export type CreateProgramProps = {
  /**
   * Form object that will be filled out by the UI.
   */
  form: FormInstance<CreateProgramFormValues>;
};

export const CreateProgram = ({ form }: CreateProgramProps) => {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const { t } = useTranslation();
  const apolloClient = useApolloClient();
  const history = useHistory();
  const teamsResponse = useQueryWithErrorHandling<AdminGetAllTeams>(
    ADMIN_GET_ALL_TEAMS,
    "teams",
    {
      fetchPolicy: "network-only",
    }
  );
  const programsResponse = useQueryWithErrorHandling<AdminGetAllPrograms>(
    ADMIN_GET_ALL_PROGRAMS,
    "programs",
    {
      fetchPolicy: "network-only",
    }
  );

  if (teamsResponse.loading || saving) {
    return <Loading />;
  }

  /**
   * Run the mutation to persist this new program.
   */
  const saveNewProgram = async (values: CreateProgramFormValues) => {
    setSaving(true);
    setSaveError(null);

    let newProgram: CreateProgramInput = {
      name: values.name,
      teamId: values.team,
      reportingPeriodType: ReportingPeriodType.monthly
    };

    try {
      if (values.basedOn) {
        const progResponse = await apolloClient.query<
          AdminGetProgram,
          AdminGetProgramVariables
        >({
          query: ADMIN_GET_PROGRAM,
          variables: { id: values.basedOn },
          // Make sure to get the latest version
          fetchPolicy: "network-only",
        });

        // Copy the Targets configuration from the given program. Note that
        // this will create entirely new targets as copies, so that in the
        // future updates to each program / target will have to be made
        // independently.
        const targets = progResponse.data.program.targets.map((target) => ({
          category: { id: target.category.id, name: target.category.name, description: target.category.description },
          tracks: target.tracks.map((track) => ({
            categoryValue: { id: track.categoryValue.id, name: track.categoryValue.name, category: { id: target.category.id } },
            targetMember: track.targetMember
          })),
          target: target.target
        }));

        const reportingPeriodType = progResponse.data.program.reportingPeriodType;

        // Revise the program input to include the targets.
        newProgram = { ...newProgram, targets, reportingPeriodType };
      }

      // Issue the creation request and handle errors.
      const createResponse = await apolloClient.mutate<
        AdminCreateProgram,
        AdminCreateProgramVariables
      >({
        mutation: ADMIN_CREATE_PROGRAM,
        variables: {
          input: newProgram,
        },
      });

      if (createResponse.errors) {
        createResponse.errors.forEach((error) => console.error(error));
        throw new Error("FAILED_SAVE");
      }

      if (!createResponse.data) {
        throw new Error("FAILED_SAVE_NO_RESPONSE");
      }

      message.success(t(`admin.program.create.success`));
      history.push(`/admin/programs/${createResponse.data!.createProgram.id}`);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form
      form={form}
      preserve={false}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 14 }}
      onFinish={saveNewProgram}
    >
      {saveError && (
        <Alert
          type="error"
          message={t(`admin.program.edit.form.validation.saveError`)}
          description={t(`admin.program.create.error.${saveError.message}`)}
          showIcon
        />
      )}

      <Form.Item
        label={t("admin.program.create.name")}
        name="name"
        rules={[
          {
            required: true,
            message: t("admin.program.create.nameRequired"),
          },
        ]}
      >
        <Input
          aria-label={t("admin.program.create.name")}
          aria-required="true"
        />
      </Form.Item>

      <Form.Item
        label={t("admin.program.create.team")}
        name="team"
        rules={[
          {
            required: true,
            message: t("admin.program.create.teamRequired"),
          },
        ]}
      >
        <Select
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) => {
            if (option && option.children && input) {
              return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            return false;
          }}
          filterSort={(a, b) =>
            a.children.toLowerCase().localeCompare(b.children.toLowerCase())
          }
          placeholder={t("admin.program.create.teamPlaceholder")}
        >
          {teamsResponse.data!.teams.map((team) => (
            <Select.Option key={team.id} value={team.id}>
              {team.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label={t("admin.program.create.basedOn")} name="basedOn">
        <Select
          placeholder={t("admin.program.create.basedOnPlaceholder")}
          showSearch
          allowClear
          optionFilterProp="children"
          loading={programsResponse.loading}
          filterOption={(input, option) =>
            option?.title.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          filterSort={(a, b) =>
            a.title.toLowerCase().localeCompare(b.title.toLowerCase())
          }
        >
          {programsResponse.data?.programs.map((p) => (
            <Select.Option
              key={p.id}
              value={p.id}
              aria-label={`${p.team?.name}: ${p.name}`}
              title={`${p.team?.name}: ${p.name}`}
            >
              <Row justify="space-between">
                <Col>{p.name}</Col>
                <Col>
                  <Typography.Text type="secondary">
                    {p.team?.name}
                  </Typography.Text>
                </Col>
              </Row>
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  );
};
