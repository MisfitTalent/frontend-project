"use client";

import { Button, Empty, Form, Input, Modal, Space, Table, Tag, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

import { type INoteItem } from "@/providers/domainSeeds";
import { useNoteActions, useNoteState } from "@/providers/noteProvider";

type NoteFormValues = {
  category: string;
  content: string;
  title: string;
};

export function NotesPanel() {
  const { notes } = useNoteState();
  const { addNote, deleteNote, updateNote } = useNoteActions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm<NoteFormValues>();

  useEffect(() => {
    if (!editingId) {
      form.resetFields();
      return;
    }

    const note = notes.find((item) => item.id === editingId);
    if (note) {
      form.setFieldsValue({
        category: note.category,
        content: note.content,
        title: note.title,
      });
    }
  }, [editingId, form, notes]);

  const handleSave = (values: NoteFormValues) => {
    if (editingId) {
      updateNote(editingId, values);
    } else {
      addNote({
        ...values,
        createdDate: new Date().toISOString().split("T")[0],
        id: Date.now().toString(),
      });
    }

    setIsModalOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Typography.Title className="!m-0" level={4}>
          Notes ({notes.length})
        </Typography.Title>
        <Button icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} type="primary">
          Add note
        </Button>
      </div>
      {notes.length === 0 ? (
        <Empty description="No notes yet" />
      ) : (
        <Table
          columns={[
            { dataIndex: "title", key: "title", title: "Title" },
            { dataIndex: "content", key: "content", title: "Content" },
            {
              dataIndex: "category",
              key: "category",
              render: (category: string) => <Tag color="#355c7d">{category}</Tag>,
              title: "Category",
            },
            { dataIndex: "createdDate", key: "createdDate", title: "Date" },
            {
              key: "actions",
              render: (_: unknown, record: INoteItem) => (
                <Space>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditingId(record.id);
                      setIsModalOpen(true);
                    }}
                    size="small"
                    type="text"
                  />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteNote(record.id)}
                    size="small"
                    type="text"
                  />
                </Space>
              ),
              title: "Actions",
            },
          ]}
          dataSource={notes}
          pagination={false}
          rowKey="id"
        />
      )}
      <Modal
        forceRender
        onCancel={() => {
          setIsModalOpen(false);
          setEditingId(null);
        }}
        onOk={() => form.submit()}
        open={isModalOpen}
        title={editingId ? "Edit note" : "Add note"}
      >
        <Form className="pt-4" form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item label="Title" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Content" name="content" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label="Category" name="category" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
