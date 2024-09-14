import {useState} from 'react';
import {Drawer, List, Badge, Button} from 'antd';
import {ShoppingCartOutlined} from '@ant-design/icons';
import {CartItemProps} from '@/interfaces/product';

interface CartProps {
  cart: CartItemProps[];
  removeFromCart: (cartItem: CartItemProps) => void;
}

const CartDrawer = ({cart, removeFromCart}: CartProps) => {
  const [isDrawerVisible, setDrawerVisible] = useState(false);

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  return (
    <>
      <Badge count={cart.length} className="cursor-pointer mx-5 mt-1">
        <ShoppingCartOutlined className="text-xl" onClick={showDrawer} />
      </Badge>

      <Drawer
        title="Shopping Cart"
        placement="right"
        onClose={closeDrawer}
        open={isDrawerVisible}
        width={350}>
        {cart.length > 0 ? (
          <List
            dataSource={cart}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button
                    key={item.cartId}
                    type="text"
                    onClick={() => removeFromCart(item)}>
                    Remove
                  </Button>,
                ]}>
                <List.Item.Meta
                  title={item.product.name}
                  description={`Quantidade: ${item.quantity}`}
                />
              </List.Item>
            )}
          />
        ) : (
          <p>Cart is empty</p>
        )}
      </Drawer>
    </>
  );
};

export default CartDrawer;
