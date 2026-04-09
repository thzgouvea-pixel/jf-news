import HomePage from "../components/home/HomePage";

export default function IndexPage() {
  return <HomePage />;
}

export async function getServerSideProps() {
  return { props: {} };
}
