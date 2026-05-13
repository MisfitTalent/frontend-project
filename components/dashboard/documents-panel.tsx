"use client";

import { Button, Empty, Form, Input, Modal, Select, Space, Table, Tag, Typography } from "antd";
import { DeleteOutlined, DownloadOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { useRef, useState } from "react";
import type { ColumnsType } from "antd/es/table";

import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { useMounted } from "@/lib/client/use-mounted";
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

const inferDocumentType = (file: File) => {
  const extension = file.name.split(".").pop()?.trim().toUpperCase();

  if (extension) {
    return extension;
  }

  if (file.type) {
    return file.type;
  }

  return "FILE";
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("The selected file could not be read."));
    reader.readAsDataURL(file);
  });

export function DocumentsPanel() {
  const { user } = useAuthState();
  const { clients } = useClientState();
  const { documents } = useDocumentState();
  const { addDocument, deleteDocument } = useDocumentActions();
  const mounted = useMounted();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
            disabled={!record.dataUrl}
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
            size="small"
            type="text"
          />
          {!isScopedClient ? (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => deleteDocument(record.id)}
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
    if (!selectedFile) {
      return;
    }

    setIsSaving(true);

    const dataUrl = await readFileAsDataUrl(selectedFile);
    addDocument({
      id: Date.now().toString(),
      clientId: values.clientId,
      dataUrl,
      mimeType: selectedFile.type || undefined,
      name: selectedFile.name,
      size: formatFileSize(selectedFile.size),
      type: inferDocumentType(selectedFile),
      uploadedDate: new Date().toISOString().split("T")[0],
    });
    closeModal();
  };

  const handleDownload = (document: IDocumentItem) => {
    if (!document.dataUrl) {
      return;
    }

    const link = window.document.createElement("a");
    link.href = document.dataUrl;
    link.download = document.name;
    link.rel = "noreferrer";
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
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
      {documents.length === 0 ? (
        <Empty description="No documents yet" />
      ) : (
        <Table
          columns={columns}
          dataSource={documents}
          pagination={false}
          rowKey="id"
        />
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
              label="File"
              required
              validateStatus={selectedFile ? undefined : "error"}
              help={selectedFile ? `${selectedFile.name} selected` : "Choose a file to upload."}
            >
              <input
                hidden
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                ref={fileInputRef}
                type="file"
              />
              <Space direction="vertical" size={8}>
                <Button
                  icon={<UploadOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                >
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
