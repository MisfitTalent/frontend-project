"use client";

import { Button, Empty, Form, Modal, Select, Space, Spin, Table, Tag, Typography, message } from "antd";
import { DeleteOutlined, DownloadOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { useRef, useState } from "react";
import type { ColumnsType } from "antd/es/table";

import { getSessionToken } from "@/lib/client/backend-api";
import { useMounted } from "@/lib/client/use-mounted";
import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { useAuthState } from "@/providers/authProvider";
import { type IDocumentItem } from "@/providers/domainSeeds";
import { useClientState } from "@/providers/clientProvider";
import { useDocumentActions, useDocumentState } from "@/providers/documentProvider";

type DocumentFormValues = {
  clientId?: string;
};

const formatFileSize = (sizeInBytes: number) => {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function DocumentsPanel() {
  const [messageApi, contextHolder] = message.useMessage();
  const { user } = useAuthState();
  const { clients } = useClientState();
  const { documents, isLoading } = useDocumentState();
  const { addDocument, deleteDocument } = useDocumentActions();
  const mounted = useMounted();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);
  const [activeDeleteId, setActiveDeleteId] = useState<string | null>(null);
  const [form] = Form.useForm<DocumentFormValues>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isScopedClient = isClientScopedUser(user?.clientIds);
  const availableClients = isScopedClient
    ? clients.filter((client) => user?.clientIds?.includes(client.id))
    : clients;

  const columns: ColumnsType<IDocumentItem> = [
    { dataIndex: "name", key: "name", title: "File name" },
    ...(!isScopedClient
      ? [
          {
            key: "client",
            render: (_: unknown, record: IDocumentItem) =>
              clients.find((client) => client.id === record.clientId)?.name ?? "Unassigned",
            title: "Client",
          },
        ]
      : []),
    {
      dataIndex: "type",
      key: "type",
      render: (type: string) => <Tag color="#355c7d">{type}</Tag>,
      title: "Type",
    },
    { dataIndex: "uploadedDate", key: "uploadedDate", title: "Uploaded" },
    { dataIndex: "size", key: "size", title: "Size" },
    {
      key: "actions",
      render: (_: unknown, record: IDocumentItem) => (
        <Space>
          <Button
            icon={<DownloadOutlined />}
            loading={activeDownloadId === record.id}
            onClick={() => void handleDownload(record)}
            size="small"
            type="text"
          />
          {!isScopedClient ? (
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={activeDeleteId === record.id}
              onClick={() => void handleDelete(record.id)}
              size="small"
              type="text"
            />
          ) : null}
        </Space>
      ),
      title: "Actions",
    },
  ];

  const resetUploadState = () => {
    setSelectedFile(null);
    setIsSaving(false);
    form.resetFields();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetUploadState();
  };

  const handleUpload = async (values: DocumentFormValues) => {
    if (!selectedFile || !values.clientId) {
      return;
    }

    setIsSaving(true);

    try {
      await addDocument({
        clientId: values.clientId,
        file: selectedFile,
      });
      closeModal();
      messageApi.success("Document uploaded.");
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Document upload failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setActiveDeleteId(id);

    try {
      await deleteDocument(id);
      messageApi.success("Document deleted.");
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Document delete failed.");
    } finally {
      setActiveDeleteId(null);
    }
  };

  const handleDownload = async (document: IDocumentItem) => {
    setActiveDownloadId(document.id);

    try {
      const headers = new Headers();
      const token = getSessionToken();

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const response = await fetch(`/api/backend/api/Documents/${document.id}/download`, {
        credentials: "same-origin",
        headers,
      });

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}.`);
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a");

      link.href = objectUrl;
      link.download = document.name;
      link.rel = "noreferrer";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Document download failed.");
    } finally {
      setActiveDownloadId(null);
    }
  };

  return (
    <div className="space-y-4">
      {contextHolder}
      <div className="flex justify-between items-center">
        <Typography.Title className="!m-0" level={4}>
          Documents ({documents.length})
        </Typography.Title>
        {!isScopedClient ? (
          <Button icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} type="primary">
            Upload document
          </Button>
        ) : null}
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spin />
        </div>
      ) : documents.length === 0 ? (
        <Empty description="No documents yet" />
      ) : (
        <Table columns={columns} dataSource={documents} pagination={false} rowKey="id" />
      )}
      {!isScopedClient && mounted ? (
        <Modal
          confirmLoading={isSaving}
          onCancel={closeModal}
          onOk={() => form.submit()}
          open={isModalOpen}
          title="Upload document"
        >
          <Form className="pt-4" form={form} layout="vertical" onFinish={handleUpload}>
            <Form.Item
              label="Client"
              name="clientId"
              rules={[{ required: true, message: "Choose the client this document belongs to." }]}
            >
              <Select
                options={availableClients.map((client) => ({
                  label: client.name,
                  value: client.id,
                }))}
                placeholder="Select client"
                showSearch
              />
            </Form.Item>
            <Form.Item
              help={selectedFile ? `${selectedFile.name} selected` : "Choose a file to upload."}
              label="File"
              required
              validateStatus={selectedFile ? undefined : "error"}
            >
              <input
                hidden
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                ref={fileInputRef}
                type="file"
              />
              <Space direction="vertical" size={8}>
                <Button icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()}>
                  Choose file
                </Button>
                {selectedFile ? (
                  <Typography.Text className="!text-slate-500">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </Typography.Text>
                ) : null}
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      ) : null}
    </div>
  );
}
