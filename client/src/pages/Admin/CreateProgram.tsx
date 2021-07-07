import React, { useState } from "react";
import { useApolloClient } from "@apollo/client";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Form, Select, Input, FormInstance, message } from "antd";

import { Loading } from "../../components/Loading/Loading";
import { useQueryWithErrorHandling } from "../../graphql/hooks/useQueryWithErrorHandling";

import {
  AdminGetProgram,
  AdminGetProgram_program_targets,
  AdminGetProgramVariables,
} from "../../graphql/__generated__/AdminGetProgram";
import { ADMIN_GET_PROGRAM } from "../../graphql/__queries__/AdminGetProgram.gql";
import {
  AdminGetAllTeams,
  AdminGetAllTeams_teams,
} from "../../graphql/__generated__/AdminGetAllTeams";
import { ADMIN_GET_ALL_TEAMS } from "../../graphql/__queries__/AdminGetAllTeams.gql";
import {
  AdminGetAllPrograms,
  AdminGetAllPrograms_programs,
} from "../../graphql/__generated__/AdminGetAllPrograms";
import { ADMIN_GET_ALL_PROGRAMS } from "../../graphql/__queries__/AdminGetAllPrograms.gql";
import { ADMIN_CREATE_PROGRAM } from "../../graphql/__mutations__/AdminCreateProgram.gql";

/**
 * Values set by the UI form.
 */
export type CreateProgramFormValues = {
  name: string;
  team: string;
  basedOn?: string;
};

export type TargetInput = {
  categoryValue: {
    id: string;
    category: {
      id: string;
    };
  };
  target: number;
};

export type NewProgramInput = {
  name: string;
  teamId: string;
  targets?: TargetInput[];
};

export type CreateProgramProps = {
  /**
   * Form object that will be filled out by the UI.
   */
  form: FormInstance<CreateProgramFormValues>;
};

export const CreateProgram = ({ form }: CreateProgramProps) => {
  const [saving, setSaving] = useState(false);
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
      // In practice the programs are probably already fetched and up-to-date
      // given that this component is *probably* mounted from the programs list.
      // However that's not certain and could change in the future, so
      // compromise with a cache-and-network query.
      fetchPolicy: "cache-and-network",
    }
  );

  if (teamsResponse.loading) {
    return <Loading />;
  }

  /**
   * Run the mutation to persist this new program.
   */
  const saveNewProgram = async (values: CreateProgramFormValues) => {
    setSaving(true);

    const newProgram: NewProgramInput = {
      name: values.name,
      teamId: values.team,
    };

    try {
      if (values.basedOn) {
        const progResponse = await apolloClient.query<
          AdminGetProgram,
          AdminGetProgramVariables
        >({
          query: ADMIN_GET_PROGRAM,
          variables: { id: values.basedOn },
        });

        // Copy the Targets configuration from the given program. Note that
        // this will create entirely new targets as copies, so that in the
        // future updates to each program / target will have to be made
        // independently.
        newProgram.targets = progResponse.data.program.targets.map(
          (target) => ({
            categoryValue: {
              id: target.categoryValue.id,
              category: {
                id: target.categoryValue.category.id,
              },
            },
            target: target.target,
          })
        );
      }

      // TODO(jnu): types
      const createResponse = await apolloClient.mutate({
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

      history.push(`/admin/programs/${createResponse.data!.createProgram.id}`);
    } catch (e) {
      message.error(t(`admin.program.create.error.${e.message}`));
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
          filterOption={(input, option) =>
            option?.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
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
            option?.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          filterSort={(a, b) =>
            a.children.toLowerCase().localeCompare(b.children.toLowerCase())
          }
        >
          {programsResponse.data?.programs.map((p) => (
            <Select.Option key={p.id} value={p.id}>
              {p.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  );
};
