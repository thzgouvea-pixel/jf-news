import HomePage from "../components/home/HomePage";

export default function HomeV2Page() {
  return <HomePage preview />;
}

export async function getServerSideProps() {
  return { props: {} };
}
