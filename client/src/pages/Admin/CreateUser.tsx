import { useLazyQuery } from "@apollo/client";
import { Card, Col, Input, Row, Spin } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SearchADUsers } from "../../graphql/__generated__/SearchADUsers";
import { SEARCH_AD_USERS } from "../../graphql/__queries__/SearchADUsers.gql";
import { CreateUserFormValues } from "../../services/account";

export type CreateUserProps = {

  setUserDetails: (x: CreateUserFormValues | undefined) => void;
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
export const CreateUser = ({ setUserDetails }: CreateUserProps) => {
  const { t } = useTranslation();
  const [getADUsers, { data, loading }] = useLazyQuery<SearchADUsers>(SEARCH_AD_USERS);
  const [selectedUser, setSelectedUser] = useState<string>();
  const [searchTerm, setSearchTerm] = useState<string>();
  const [, setDelay] = useState<ReturnType<typeof setTimeout> | undefined>();


  useEffect(() => {
    if (searchTerm && searchTerm.length > 2) {
      setDelay(delay => {
        if (delay) {
          clearTimeout(delay);
        }
        return setTimeout(
          () => setSearchTerm(currSearchTerm => {
            //check we still have more than 2 chars.
            if (currSearchTerm && currSearchTerm.length > 2) {
              getADUsers({ variables: { search: currSearchTerm } })
                .then(() => setSelectedUser(undefined))
                .finally(() => delay && clearTimeout(delay));
            }
            return currSearchTerm;
          }), 1000);
      });
    }
  }, [searchTerm, setSearchTerm, setDelay, getADUsers]);

  return (
    <Row gutter={[16, 16]} justify="center">
      <Col span={24}>
        <Input
          autoFocus
          allowClear
          placeholder={t("admin.user.search")}
          aria-label={t("admin.user.search")}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Col>
      {
        loading && <Col span={1}><Spin size="large" /></Col>
      }
      <Col span={24}>
        <Row justify="center" gutter={[16, 16]} style={{ maxHeight: "50vh", overflowY: "scroll" }}>
          {
            data?.adUsers &&
            data.adUsers
              .flat()
              .filter(x => x.workEmail && x.username)
              .sort((a, b) => (a.surname ?? "").localeCompare(b.surname ?? ""))
              .sort((a, b) => Number(!!b.idCardPhotoUrl) - Number(!!a.idCardPhotoUrl))
              .map(x =>
                <Col key={x.username} span={8}>
                  <Card
                    hoverable
                    size="small"
                    style={
                      selectedUser === x.username ?
                        { border: "2px solid blue", boxShadow: "0.2em 0.3em 0.75em rgba(0,0,50,0.3)" } : undefined
                    }
                    cover={x.idCardPhotoUrl && x.prefName && <img src={x.idCardPhotoUrl} alt={x.prefName} />}
                    onClick={
                      () => setSelectedUser((curr) => {
                        if (curr === x.username) {
                          setUserDetails(undefined);
                          return undefined;
                        }
                        else {
                          setUserDetails(
                            {
                              first_name: x.prefName ? x.prefName : x.firstName ?? "unknown",
                              last_name: x.surname ?? "",
                              email: x.workEmail ?? "",
                              username: x.username ?? ""
                            });
                          return x.username!
                        }
                      })
                    }
                  >
                    <Card.Meta
                      title={`${x.prefName} ${x.surname}`}
                      description={x.positionName}
                    />
                  </Card>
                </Col>
              )

          }
        </Row>
      </Col>
    </Row>

  );
};
