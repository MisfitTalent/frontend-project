"use client";

import { Button, Empty, Form, Input, Modal, Space, Table, Tag, Typography } from "antd";
import { DeleteOutlined, DownloadOutlined, PlusOutlined } from "@ant-design/icons";
import { useState } from "react";

import { type IDocumentItem } from "@/providers/domainSeeds";
import { useDocumentActions, useDocumentState } from "@/providers/documentProvider";

type DocumentFormValues = {
  fileName: string;
  fileType: string;
};

export function DocumentsPanel() {
  const { documents } = useDocumentState();
  const { addDocument, deleteDocument } = useDocumentActions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm<DocumentFormValues>();

  const handleUpload = (values: DocumentFormValues) => {
    addDocument({
      id: Date.now().toString(),
      name: values.fileName,
      size: "1.0 MB",
      type: values.fileType,
      uploadedDate: new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(false);
    form.resetFields();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Typography.Title className="!m-0" level={4}>
          Documents ({documents.length})
        </Typography.Title>
        <Button icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} type="primary">
          Upload document
        </Button>
      </div>
      {documents.length === 0 ? (
        <Empty description="No documents yet" />
      ) : (
        <Table
          columns={[
            { dataIndex: "name", key: "name", title: "File name" },
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
                  <Button icon={<DownloadOutlined />} size="small" type="text" />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteDocument(record.id)}
                    size="small"
                    type="text"
                  />
                </Space>
              ),
              title: "Actions",
            },
          ]}
          dataSource={documents}
          pagination={false}
          rowKey="id"
        />
      )}
      <Modal
        forceRender
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        open={isModalOpen}
        title="Upload document"
      >
        <Form className="pt-4" form={form} layout="vertical" onFinish={handleUpload}>
          <Form.Item label="File name" name="fileName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="File type" name="fileType" rules={[{ required: true }]}>
            <Input placeholder="e.g., PDF, DOCX, XLSX" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
