import { useMutation, useQuery } from "@apollo/client";
import { AutoComplete, Button, Card, Col, Input, Row, Form, PageHeader, Typography, Tag, Divider } from "antd";
const { Text } = Typography;
import { TagsOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from "react";
import { AdminUpdateTag } from "../../graphql/__generated__/AdminUpdateTag";
import { AdminDeleteTag } from "../../graphql/__generated__/AdminDeleteTag";
import { AdminCreateTag } from "../../graphql/__generated__/AdminCreateTag";
import { GetAllTags, GetAllTags_tags } from "../../graphql/__generated__/GetAllTags";
import { ADMIN_CREATE_TAG } from "../../graphql/__mutations__/AdminCreateTag.gql";
import { ADMIN_UPDATE_TAG } from "../../graphql/__mutations__/AdminUpdateTag.gql";
import { ADMIN_DELETE_TAG } from "../../graphql/__mutations__/AdminDeleteTag.gql";
import { GET_ALL_TAGS } from "../../graphql/__queries__/GetAllTags.gql";
import { useTranslation } from "react-i18next";
import { useTranslationWithPrefix } from "../../components/useTranslationWithPrefix";

interface ITag {
    id?: string,
    name: string,
    description: string | null,
    tagType?: string | null
}

export const EditTags = () => {
    const [isDragging, setIsDragging] = useState<string>();
    const [isOver, setIsOver] = useState<string>();
    const [newTag, setNewTag] = useState<string>();
    const [form] = Form.useForm<ITag>();

    const { t } = useTranslation();
    const { tp } = useTranslationWithPrefix("admin.tag.index");

    const { loading, error, data } = useQuery<GetAllTags>(
        GET_ALL_TAGS,
        {
            fetchPolicy: "network-only",
        }
    );

    const [saveTag, { loading: saving, reset: resetSave }] = useMutation<AdminUpdateTag>(
        ADMIN_UPDATE_TAG,
        { refetchQueries: [GET_ALL_TAGS] }
    );

    const [createTag, { loading: creating, reset: resetCreate }] = useMutation<AdminCreateTag>(
        ADMIN_CREATE_TAG,
        { refetchQueries: [GET_ALL_TAGS] }
    );

    const [deleteTag, { reset: resetDelete }] = useMutation<AdminDeleteTag>(
        ADMIN_DELETE_TAG,
        { refetchQueries: [GET_ALL_TAGS] }
    );


    const groupedByTagType = useMemo(() => {
        return data?.tags.reduce((grouped, tag) => {
            const currGroup = grouped.get(tag.tagType);
            if (currGroup) {
                grouped.set(tag.tagType, [...currGroup, tag])
            } else {
                grouped.set(tag.tagType, [tag]);
            }
            return grouped;
        }, new Map<string, GetAllTags_tags[]>());
    }, [data?.tags]);

    if (loading) return <p>loading</p>
    if (error) return <p>{error.message}</p>
    if (!groupedByTagType) return <p>No tags</p>

    interface INewTagFrmProps {
        group: string
    }

    const NewTagForm: React.FC<INewTagFrmProps> = ({ group }: INewTagFrmProps) => {

        useEffect(() => { form.setFieldsValue({ tagType: group }) }, [group]);

        return <Form
            layout="inline"
            form={form}
            onFinish={() => createTag({
                variables: {
                    input: { ...form.getFieldsValue() }
                }
            }).finally(() => { setNewTag(undefined); resetCreate(); })}
        >
            <Form.Item
                name="name"
                label={tp("name")}
                rules={[{ required: true, message: t("tagNameRequired") }]}
            >
                <Input placeholder={tp("name")} />
            </Form.Item>
            <Form.Item
                name="description"
                label={tp("description")}

                rules={[{ required: true, message: t("tagDescriptionRequired") }]}
            >
                <Input placeholder={tp("description")} />
            </Form.Item>
            <Form.Item
                initialValue={group}
                label={tp("group")}
                name="tagType"

                rules={[{ required: true, message: t("tagTypeRequired") }]}
            >
                <AutoComplete
                    style={{ width: "150px" }}
                    options={
                        Array.from(new Set(data?.tags.map(x => x.tagType)))
                            .map(group => ({ value: group }))
                    }
                    filterOption={(inputValue, option) =>
                        option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                    }
                />
            </Form.Item>
            <div style={{ flexGrow: 1 }} />
            <Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={creating}
                    onClick={() => {
                        form.submit()
                    }
                    }
                >{tp("submit")}</Button>
            </Form.Item>

        </Form>
    }

    interface ITagProps {
        tag: GetAllTags_tags,
        key: string,
        showDelete?: boolean,
        showEdit?: boolean
    }

    const MyTag = ({ tag, showDelete, showEdit, key }: ITagProps) =>
        <Tag
            key={key}
            closable={showDelete}
            draggable
            aria-label={tag.description ?? t("noDescription")}
            color={isDragging === tag.id ? "processing" : isOver === tag.id ? "magenta" : tag.tagType === "unassigned" ? "default" : "success"}
            onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", tag.id);
                e.dataTransfer.dropEffect = "move";
                setIsDragging(tag.id);
            }}
            onDragEnd={(e) => {
                setIsDragging(undefined);
                e.dataTransfer.clearData()
            }}
            onClose={(e) => {
                //if you don't do this a weird render clash happens and the next tag in the list also disappears, altho not deleted.
                e.preventDefault();
                deleteTag({ variables: { id: tag.id } })
                    .finally(() => resetDelete());
            }}
            onMouseEnter={() => setIsOver(tag.id)}
            onMouseLeave={() => setIsOver(undefined)}
        >
            <Text
                editable={showEdit && isOver === tag.id ? {
                    onChange: (e) => {
                        e !== tag.name && saveTag({
                            variables: {
                                input: {
                                    id: tag.id, name: e
                                }
                            }
                        }).finally(() => resetSave());
                    }
                } : false}
            >
                {tag.name}
            </Text>
        </Tag>


    return <Row gutter={[10, 10]}>
        <Col span={24}>
            <PageHeader
                title={tp("title")}
                subTitle={tp("subtitle")}
                extra={[
                    <Button
                        key={1}
                        size="large"
                        shape="circle"
                        icon={<TagsOutlined />}
                        type={newTag ? "default" : "primary"}
                        loading={creating}
                        onClick={() => {
                            setNewTag((curr) => curr ? undefined : "unassigned");
                        }
                        }
                    />,
                ]}
            />

        </Col>

        <Col span={24}>
            {newTag && <NewTagForm group={newTag} key={1} />}
        </Col>
        <Col span={24}>
            <Divider orientation="left">{t("allTags")}</Divider>
        </Col>
        <Col span={24}>
            {
                Array.from(data?.tags ?? [] as GetAllTags_tags[])
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((tag, i) => MyTag({ tag: tag, showDelete: true, showEdit: true, key: `all-${i}` }))
            }
        </Col>
        <Col span={24}>
            <Divider orientation="left">{t("tagGroups")}</Divider>
        </Col>
        {
            Array.from(groupedByTagType)
                .filter(([k,]) => k !== "unassigned")
                .sort(([a,], [b,]) => a.localeCompare(b))
                .map(([group, tags]) =>
                    <Col span={6} key={group}>
                        <Card
                            title={group}
                            style={{ borderRadius: "5px", border: isOver === group ? "5px solid coral" : saving ? "2px solid mediumaquamarine" : "1px solid #dddddd" }}
                            extra={<Button
                                type={newTag ? "default" : "primary"}
                                size="small"
                                shape="circle"
                                icon={<TagsOutlined />}
                                onClick={() => {
                                    setNewTag((curr) => curr ? undefined : group);
                                }
                                }
                            />}
                            onDrop={(e) => {
                                e.preventDefault();

                                const dropId = e.dataTransfer.getData("text");
                                const dropTag = data?.tags.find(x => x.id === dropId);

                                if (dropTag && dropTag.tagType === group) return;

                                saveTag({
                                    variables: {
                                        input: { id: dropId, tagType: group }
                                    }
                                }).finally(() => resetSave());

                                e.dataTransfer.clearData();
                            }
                            }
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsOver(group);
                            }
                            }
                            onDragLeave={() => {
                                setIsOver(undefined);
                            }
                            }
                        >
                            {
                                tags
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((tag, i) => MyTag({ tag: tag, showDelete: false, showEdit: false, key: `grouped-${i}` }))
                            }
                        </Card>
                    </Col>
                )
        }
    </Row>

}