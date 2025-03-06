"use client";

import DependencyTree from "@/app/components/DependencyTree"; // Adjust the import path
import Dependency from "@/app/interfaces/Dependency";
import { Title } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const Page = () => {
  const { data: session } = useSession();
  const [fatherDependency, setFatherDependency] = useState<Dependency>();
  const [childrenDependencies, setChildrenDependencies] = useState<
    Dependency[]
  >([]);

  useEffect(() => {
    const fetchFatherDependencyWithHierarchy = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/dependencies/${session?.user?.email}/hierarchy`
        );

        setFatherDependency(response.data.fatherDependency ?? undefined);
        setChildrenDependencies(response.data.childrenDependencies ?? []);
      } catch (error) {
        console.error("Error fetching templates:", error);
        showNotification({
          title: "Error",
          message: "Ocurrió un error",
          color: "red",
        });
      }
    };

    fetchFatherDependencyWithHierarchy();
  }, []);

  return (
    <div style={{ margin: "0px 20px 0px 20px" }}>
      {fatherDependency && (
        <>
          <Title __size="sm" mb={15}>
            {" "}
            Plantillas hijas de la dependencia {fatherDependency.name}
          </Title>
          <DependencyTree dependencies={childrenDependencies} />
        </>
      )}
    </div>
  );
};

export default Page;
