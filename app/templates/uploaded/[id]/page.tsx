"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { Container, Table, Title, Text } from "@mantine/core";
import { useSession } from "next-auth/react";

interface UploadedData {
  field_name: string;
  value: any;
}

const UploadedTemplatePage = () => {
  const { id } = useParams();
  const [uploadedData, setUploadedData] = useState<UploadedData[]>([]);
  const [templateName, setTemplateName] = useState("");
  const { data: session } = useSession();

  useEffect(() => {
    const fetchUploadedData = async () => {
      if (id && session?.user?.email) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/pTemplates/dimension/mergedData`,
            {
              params: {
                pubTem_id: id,
                email: session?.user?.email,
              },
            }
          );

          const data = response.data.data;
          console.log("DATA:",data);
          setUploadedData(data);
          setTemplateName(`Template ID: ${id}`);
        } catch (error) {
          console.error("Error fetching uploaded data:", error);
        }
      }
    };

    fetchUploadedData();
  }, [id, session]);

  return (
    <Container>
      <Title
        ta="center"
        mb={"md"}
      >{`Datos Cargados para: ${templateName}`}</Title>
      {uploadedData.length === 0 ? (
        <Text ta={"center"}>No hay datos cargados para esta plantilla.</Text>
      ) : (
        <Table striped withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Campo</Table.Th>
              <Table.Th>Valor</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {uploadedData.map((data, index) => (
              <Table.Tr key={index}>
                <Table.Td>{data.field_name}</Table.Td>
                <Table.Td>{data.value}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Container>
  );
};

export default UploadedTemplatePage;
