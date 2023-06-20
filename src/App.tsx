import { useEffect } from 'react';
import './App.css';
import { useApi } from './providers/ApiProvider';

const App = () => {
  const client = useApi();
  useEffect(() => {
    client.fetchServerTime().then(console.log);
  }, []);

  return (
    <>
      <h1 className="text-3xl font-bold underline bg-red-300">Hello world!</h1>
    </>
  );
};

export default App;
