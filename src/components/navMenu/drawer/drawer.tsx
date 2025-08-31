import {useState} from 'react';
import {Drawer, List, Badge, Divider} from 'antd';
import {ShoppingCartOutlined} from '@ant-design/icons';
import {CartItemProps, ProductProps} from '@/interfaces/product';
import CustomButton from '@/components/customButtton/customButton';
import {useCart} from '@/contexts/cartContext';
import {DeleteOutlined} from '@ant-design/icons';
import {useRouter} from 'next/navigation';

const CartDrawer = () => {
  const [isDrawerVisible, setDrawerVisible] = useState(false);
  const {cartItems, removeFromCart, cartIsLoading, updateCartQuantity} =
    useCart();
  const router = useRouter();

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
          <>
            <List
              dataSource={cartItems}
              renderItem={item => (
                <List.Item
                  actions={[
                    <div key={`price-${item.cartId}`} className="text-right">
                      <div className="font-semibold">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        ${item.product.price.toFixed(2)} each
                      </div>
                    </div>,
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
                            handleDecreaseQuantity(
                              item.productId,
                              item.quantity,
                            )
                          }
                          disabled={cartIsLoading}
                          buttonText="-"
                          backgroundColor="border"
                        />
                        <div className="border border-border rounded-lg mx-2 py-2 px-5">
                          <span className="text-sm">{item.quantity}</span>
                        </div>
                        <CustomButton
                          onClick={() =>
                            handleIncreaseQuantity(
                              item.productId,
                              item.quantity,
                            )
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

            <Divider />

            <div className="flex justify-between mb-4">
              <span className="font-bold">Total:</span>
              <span className="font-bold">
                $
                {cartItems
                  .reduce(
                    (total, item) => total + item.product.price * item.quantity,
                    0,
                  )
                  .toFixed(2)}
              </span>
            </div>

            <CustomButton
              buttonText="Proceed to Checkout"
              onClick={() => {
                closeDrawer();
                router.push('/checkout');
              }}
            />
          </>
        ) : (
          <div className="text-center">
            <p className="mb-4">Your cart is empty</p>
            <CustomButton
              buttonText="Browse Products"
              onClick={() => {
                closeDrawer();
                router.push('/products/catalog');
              }}
            />
          </div>
        )}
      </Drawer>
    </>
  );
};

export default CartDrawer;
