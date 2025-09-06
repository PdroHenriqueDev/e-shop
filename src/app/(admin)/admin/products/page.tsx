'use client';
import {useEffect, useState} from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type {ColumnsType} from 'antd/es/table';
import type {UploadFile} from 'antd/es/upload/interface';
import Image from 'next/image';

import {AdminProduct, AdminCategory} from '@/interfaces/admin';

export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null,
  );
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      message.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFileList([]);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (product: AdminProduct) => {
    setEditingProduct(product);
    form.setFieldsValue({
      name: product.name,
      description: product.description,
      price: product.price,
      categoryId: product.categoryId,
    });
    setFileList(
      product.image
        ? [
            {
              uid: '-1',
              name: 'image.png',
              status: 'done',
              url: product.image,
            },
          ]
        : [],
    );
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        message.success('Product deleted successfully');
        fetchProducts();
      } else {
        message.error('Failed to delete product');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      message.error('Failed to delete product');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('description', values.description);
      formData.append('price', values.price.toString());
      formData.append('categoryId', values.categoryId.toString());

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('image', fileList[0].originFileObj);
      }

      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (response.ok) {
        message.success(
          `Product ${editingProduct ? 'updated' : 'created'} successfully`,
        );
        setModalVisible(false);
        fetchProducts();
      } else {
        message.error(
          `Failed to ${editingProduct ? 'update' : 'create'} product`,
        );
      }
    } catch (error) {
      console.error('Failed to submit product:', error);
      message.error('Failed to submit product');
    }
  };

  const columns: ColumnsType<AdminProduct> = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 80,
      render: (imageUrl: string) => (
        <div className="w-12 h-12 relative">
          <Image
            src={imageUrl || '/placeholder.jpg'}
            alt="Product"
            fill
            className="object-cover rounded"
          />
        </div>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Category',
      dataIndex: ['category', 'name'],
      key: 'category',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this product?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No">
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-primary min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark">Products Management</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          className="bg-secondary border-secondary hover:bg-yellow-400 text-dark">
          Add Product
        </Button>
      </div>

      <div className="bg-primary border border-border rounded-lg shadow-sm">
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          className="text-dark"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} products`,
          }}
        />
      </div>

      <Modal
        title={
          <span className="text-dark font-semibold">
            {editingProduct ? 'Edit Product' : 'Add Product'}
          </span>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        className="text-dark">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4">
          <Form.Item
            name="name"
            label="Product Name"
            rules={[{required: true, message: 'Please enter product name'}]}>
            <Input placeholder="Enter product name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{required: true, message: 'Please enter description'}]}>
            <Input.TextArea rows={4} placeholder="Enter product description" />
          </Form.Item>

          <Form.Item
            name="price"
            label="Price"
            rules={[{required: true, message: 'Please enter price'}]}>
            <InputNumber
              min={0}
              step={0.01}
              placeholder="0.00"
              className="w-full"
            />
          </Form.Item>

          <Form.Item
            name="categoryId"
            label="Category"
            rules={[{required: true, message: 'Please select a category'}]}>
            <Select placeholder="Select category">
              {categories.map(category => (
                <Select.Option key={category.id} value={category.id}>
                  {category.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Product Image">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({fileList}) => setFileList(fileList)}
              beforeUpload={() => false}
              maxCount={1}>
              {fileList.length < 1 && (
                <div>
                  <UploadOutlined />
                  <div style={{marginTop: 8}}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item className="mb-0">
            <Space>
              <Button
                onClick={() => setModalVisible(false)}
                className="border-border text-dark hover:border-secondary">
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                className="bg-secondary border-secondary hover:bg-yellow-400 text-dark">
                {editingProduct ? 'Update' : 'Create'} Product
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
