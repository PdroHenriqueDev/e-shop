export interface CustomButtonProps {
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  buttonText: string;
  isLoading?: boolean;
}
