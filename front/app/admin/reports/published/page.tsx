"use client"

import {use, useEffect, useState} from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Button, Center, Container, Group, Pagination, Table, TextInput } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

interface Report {
    _id: string;
  name: string;
  description: string;
  report_example_id: string;
  report_example_link: string;
  requires_attachment: boolean;
  file_name: string;
  created_by: {
    email: string;
    full_name: string;
  };
}

interface Dimension {
    _id: string;
    name: string;
  }
  
interface Period {
    _id: string;
    name: string;
}

interface PublishedReport {
    _id: string;
    report: Report;
    dimensions: Dimension;
    period: Period;
}

const AdminPubReportsPage = () => {
    const { data: session } = useSession();
    const [pubReports, setPubReports] = useState<PublishedReport[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const router = useRouter();

    const fetchReports = async (page: number, search: string) => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/pReports/all`,
                {
                    params: {
                        page: page,
                        search: search,
                        email: session?.user?.email
                    }
                }
            )
            if(response.data) {
                console.log(response.data);
                setPubReports(response.data.publishedReports);
                setTotalPages(response.data.totalPages);
            }
        } catch (error) {
            console.error(error);
            setPubReports([]);
        }
    }
    useEffect(() => {
        if(session?.user?.email) {
            fetchReports(page, search);
        }
    }, [page, session?.user?.email]);

    useEffect(() => {
        if(session?.user?.email) {
            const delayDebounceFn = setTimeout(() => {
                fetchReports(page, search);
            }, 500)
            return () => clearTimeout(delayDebounceFn)
        }
    }, [search, session?.user?.email, page]);


    const rows = pubReports?.length ? pubReports.map((pubReport: PublishedReport) => {
        return (
            <Table.Tr key={pubReport._id}>
                <Table.Td>{pubReport.period.name}</Table.Td>
                <Table.Td>{pubReport.report.name}</Table.Td>
            </Table.Tr>
        );
    }) : (
        <Table.Tr>
            <Table.Td colSpan={2}>No reports found</Table.Td>
        </Table.Tr>
    );
    

    return (
        <Container size="xl">
            <TextInput
                placeholder='Buscar en los reportes publicados'
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                mb="md"
            />
            <Group>
                <Button 
                onClick={() => router.push('/admin/reports')}
                variant="outline"
                leftSection={<IconArrowLeft size={16} />}>
                Ir a Gestión de Reportes
                </Button>
            </Group>
            <Table striped withTableBorder mt="md">
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Periodo</Table.Th>
                        <Table.Th>Reporte</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>
            <Center>
                <Pagination
                    mt={15}
                    value={page}
                    onChange={setPage}
                    total={totalPages}
                    siblings={1}
                    boundaries={3}
                />
            </Center>
        </Container>
    )
}

export default AdminPubReportsPage;