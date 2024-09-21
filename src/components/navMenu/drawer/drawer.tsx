import {useState} from 'react';
import {Drawer, List, Badge, Button} from 'antd';
import {ShoppingCartOutlined} from '@ant-design/icons';
import {CartItemProps, ProductProps} from '@/interfaces/product';
import CustomButton from '@/components/customButtton/customButton';
import {useCart} from '@/contexts/cartContext';
import {DeleteOutlined} from '@ant-design/icons';

interface CartProps {
  cart: CartItemProps[];
  isLoading: boolean;
  removeFromCart: (cartItem: CartItemProps) => void;
  addToCart: (product: ProductProps) => void;
}

const CartDrawer = () => {
  const [isDrawerVisible, setDrawerVisible] = useState(false);
  const {cartItems, removeFromCart, cartIsLoading, updateCartQuantity} =
    useCart();

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  const handleIncreaseQuantity = async (
    productId: number,
    currentQuantity: number,
  ) => {
    await updateCartQuantity(productId, currentQuantity + 1);
  };

  const handleDecreaseQuantity = async (
    productId: number,
    currentQuantity: number,
  ) => {
    if (currentQuantity > 1) {
      await updateCartQuantity(productId, currentQuantity - 1);
    }
  };

  return (
    <>
      <Badge count={cartItems.length} className="cursor-pointer mx-5 mt-1">
        <ShoppingCartOutlined className="text-xl" onClick={showDrawer} />
      </Badge>

      <Drawer
        title="Shopping Cart"
        placement="right"
        onClose={closeDrawer}
        open={isDrawerVisible}
        width={450}>
        {cartItems.length > 0 ? (
          <List
            dataSource={cartItems}
            renderItem={item => (
              <List.Item
                actions={[
                  <DeleteOutlined
                    key={item.cartId}
                    className={`text-danger text-lg ${cartIsLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    onClick={() => {
                      if (!cartIsLoading) {
                        removeFromCart(item);
                      }
                    }}
                  />,
                ]}>
                <List.Item.Meta
                  title={
                    <span className="text-base font-semibold">
                      {item.product.name}
                    </span>
                  }
                  description={
                    <div className="flex items-center">
                      <CustomButton
                        onClick={() =>
                          handleDecreaseQuantity(item.productId, item.quantity)
                        }
                        disabled={cartIsLoading}
                        buttonText="-"
                        backgroundColor="border"
                      />
                      <span className="mx-6 text-center">
                        Quantidade: {item.quantity}
                      </span>
                      <CustomButton
                        onClick={() =>
                          handleIncreaseQuantity(item.productId, item.quantity)
                        }
                        disabled={cartIsLoading}
                        buttonText="+"
                      />
                    </div>
                  }
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
