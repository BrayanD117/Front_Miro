import { Center, Loader } from "@mantine/core";

const LoadingScreen = () => {
  return (
    <Center style={{ height: "100vh" }}>
      <Loader size="xl" variant="bars" />
    </Center>
  );
};

export default LoadingScreen;
