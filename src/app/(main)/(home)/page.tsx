import {getServerSession} from 'next-auth';
import {redirect} from 'next/navigation';

export default async function Home() {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  return <div>This will be an e-commerce</div>;
}
