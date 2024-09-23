"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Table,
  TextInput,
  Pagination,
  Button,
  Modal,
  Title,
  ScrollArea,
  Center,
} from "@mantine/core";
import axios from "axios";
import dayjs from "dayjs";

interface Log {
  _id: string;
  user: {
    full_name: string;
    email: string;
  };
  published_template: {
    _id: string;
    name: string;
  };
  date: string;
  errors: ErrorItem[];
}

interface ErrorItem {
  column: string;
  description: ErrorDescription[];
}

interface ErrorDescription {
  register: number;
  value: string;
  message: string;
}

const AdminLogsPage = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [modalOpened, setModalOpened] = useState(false);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/logs`,
        {
          params: {
            page,
            limit: 10,
            search,
          },
        }
      );
      setLogs(response.data.logs);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error al obtener los logs:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, search]);

  const rows = logs.map((log) => (
    <Table.Tr key={log._id}>
      <Table.Td>{log.user.full_name}</Table.Td>
      <Table.Td>{log.published_template.name}</Table.Td>
      <Table.Td>{dayjs(log.date).format("DD/MM/YYYY HH:mm")}</Table.Td>
      <Table.Td>{log.errors.length}</Table.Td>
      <Table.Td>
        <Button
          variant="outline"
          onClick={() => {
            setSelectedLog(log);
            setModalOpened(true);
          }}
        >
          Ver detalles
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl">
      <Title order={2} mb="md">
        Logs
      </Title>
      <TextInput
        placeholder="Buscar logs"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <ScrollArea>
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Usuario</Table.Th>
              <Table.Th>Plantilla</Table.Th>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Número de Errores</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>
      <Center>
        <Pagination
          value={page}
          onChange={setPage}
          total={totalPages}
          mt="md"
        />
      </Center>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title="Detalles del Log"
        size="lg"
      >
        {selectedLog && (
          <div>
            <p>
              <strong>Usuario:</strong> {selectedLog.user.full_name} (
              {selectedLog.user.email})
            </p>
            <p>
              <strong>Plantilla:</strong> {selectedLog.published_template.name}
            </p>
            <p>
              <strong>Fecha:</strong>{" "}
              {dayjs(selectedLog.date).format("DD/MM/YYYY HH:mm")}
            </p>
            <p>
              <strong>Errores:</strong>
            </p>
            <ScrollArea style={{ height: 300 }}>
              {selectedLog.errors.map((error, index) => (
                <div key={index} style={{ marginBottom: "1rem" }}>
                  <p>
                    <strong>Columna:</strong> {error.column}
                  </p>
                  {error.description.map((desc, idx) => (
                    <div
                      key={idx}
                      style={{ marginLeft: "1rem", marginBottom: "0.5rem" }}
                    >
                      <p>
                        <strong>Registro:</strong> {desc.register}
                      </p>
                      <p>
                        <strong>Valor:</strong> {desc.value}
                      </p>
                      <p>
                        <strong>Mensaje:</strong> {desc.message}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </ScrollArea>
          </div>
        )}
      </Modal>
    </Container>
  );
};

export default AdminLogsPage;
