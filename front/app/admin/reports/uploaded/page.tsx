"use client"

import {use, useEffect, useState} from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import {  Badge, Button, Center, Container, Group, Modal, Pagination, Progress, rem, Select, Stack, Table, Text, TextInput, Title, Tooltip } from '@mantine/core';
import { IconArrowLeft, IconFileDescription, IconFolderOpen, IconReportSearch } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { format } from 'fecha';

const options = [
    {value: 'Pendiente Aprobación', label: 'Pendiente Aprobación'},
    {value: 'Aprobado', label: 'Aprobado'},
    {value: 'Rechazado', label:'Rechazado'}
]

interface Report {
    _id: string;
  name: string;
  description: string;
  report_example_id: string;
  report_example_link: string;
  report_example_download: string;
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
    responsible_start_date: Date;
    responsible_end_date: Date;
}

interface File {
    id: string;
    name: string;
    view_link: string;
    download_link: string;
    folder_id: string;
}

interface FilledReport {
    dimension: Dimension
    send_by: any
    loaded_date: Date
    report_file: File
    attachments: File[]
    status: string
}

interface PublishedReport {
    _id: string
    report: Report
    dimensions: Dimension[]
    period: Period
    filled_reports: FilledReport[]
    folder_id: string
}

const AdminPubReportsPage = () => {
    const { data: session } = useSession();
    const [pubReports, setPubReports] = useState<PublishedReport[]>([]);
    const [selectedReport, setSelectedReport] = useState<PublishedReport | null>(null);
    const [opened, setOpened] = useState<boolean>(false);
    const [dimensions, setDimensions] = useState<Dimension[]>([]);
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

    const giveReportPercentage = (pubReport: PublishedReport) => {
        return pubReport.filled_reports.length/pubReport.dimensions.length*100;
    }

    const truncateString = (str: string, maxLength: number = 20): string => {
        return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
    }

    const selectedReportRows = selectedReport?.filled_reports.map((filledReport: FilledReport) => {
        return (
            <Table.Tr key={filledReport.report_file.id}>
                <Table.Td>{filledReport.dimension.name}</Table.Td>
                <Table.Td>{format(new Date(filledReport.loaded_date), 'D/M/YYYY')}</Table.Td>
                <Table.Td>{truncateString(filledReport.send_by.full_name)}</Table.Td>
                <Table.Td>
                    <Center>
                        <Select 
                            data={options}
                            w={rem(200)}
                            value={filledReport.status}
                            c='red'
                        />
                    </Center>
                </Table.Td>
                <Table.Td>
                    <Center>
                        <Group>
                            <Tooltip label='Ver reporte'>
                                <Button size='compact-lg' variant='outline' onClick={() => {
                                    if(typeof window !== 'undefined') {
                                        window.open(filledReport.report_file.view_link);
                                    }
                                }}>
                                    <IconReportSearch size={16} />
                                </Button>
                            </Tooltip>
                            <Tooltip label='Ver carpeta de reporte'>
                                <Button size='compact-lg' variant='outline' onClick={() => {
                                    if(typeof window !== 'undefined') {
                                        window.open(`https://drive.google.com/drive/folders/${filledReport.report_file.folder_id}`);
                                    }
                                }}>
                                    <IconFolderOpen size={16} />
                                </Button>
                            </Tooltip>
                        </Group>
                    </Center>
                </Table.Td>
            </Table.Tr>
        )
    });

    const rows = pubReports?.length ? pubReports.map((pubReport: PublishedReport) => {
        return (
            <Table.Tr key={pubReport._id}>
                <Table.Td maw={rem(55)}>
                    <Center>
                      <Badge size={rem(12)} h={rem(8)} variant='light' p={'xs'}>{pubReport.period.name}</Badge>
                    </Center>
                </Table.Td>
                <Table.Td>{pubReport.report.name}</Table.Td>
                <Table.Td>{pubReport.report.file_name}</Table.Td>
                <Table.Td>
                    <Center>
                        <Stack gap={0}>
                            <Progress.Root 
                                mt={'xs'}
                                size={'md'}
                                radius={'md'}
                                w={rem(200)}
                                onClick={() => {
                                    setSelectedReport(pubReport);
                                    setOpened(true);
                                }}
                                style={{cursor: 'pointer'}}
                            >
                                <Progress.Section value={giveReportPercentage(pubReport)} striped animated/>
                            </Progress.Root>
                            <Text size='sm' ta={'center'} mt={rem(5)}>{pubReport.filled_reports.length} de {pubReport.dimensions.length}</Text>
                        </Stack>
                    </Center>
                </Table.Td>
                <Table.Td>
                    <Center>
                        <Group>
                            <Tooltip label='Ver reportes cargados'>
                                <Button variant='outline' onClick={() => {
                                    setSelectedReport(pubReport);
                                    setOpened(true);
                                }}
                                >
                                    <IconFileDescription size={16} />
                                </Button>
                            </Tooltip>
                            <Tooltip label='Ver carpeta de reportes'>
                                <Button variant='outline' onClick={() => {
                                    if(typeof window !== 'undefined') {
                                        window.open(`https://drive.google.com/drive/folders/${pubReport.folder_id}`);
                                    }
                                }}>
                                    <IconFolderOpen size={16} />
                                </Button>
                            </Tooltip>
                        </Group>
                    </Center>
                </Table.Td>
            </Table.Tr>
        );
    }) : (
        <Table.Tr>
            <Table.Td colSpan={10}>No se encontraron reportes publicados</Table.Td>
        </Table.Tr>
    );
    

    return (
        <Container size="xl">
            <Title ta="center" mb={"md"}>Proceso Cargue de Reportes</Title>
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
                        <Table.Th maw={rem(55)}><Center>Periodo</Center></Table.Th>
                        <Table.Th>Reporte</Table.Th>
                        <Table.Th>Nombre de Archivo</Table.Th>
                        <Table.Th><Center>Progreso</Center></Table.Th>
                        <Table.Th><Center>Acciones</Center></Table.Th>
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
            <Modal
                opened={opened}
                onClose={() => setOpened(false)}
                size="xl"
                overlayProps={{
                  backgroundOpacity: 0.55,
                  blur: 3,
                }}
                title={<Title size={'md'}>Reporte: {selectedReport?.report.name}</Title>}
            >
                <Table striped withTableBorder mt="md">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Dimensión</Table.Th>
                            <Table.Th>Carga</Table.Th>
                            <Table.Th>Enviado por</Table.Th>
                            <Table.Th><Center>Estado</Center></Table.Th>
                            <Table.Th><Center>Acciones</Center></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{selectedReportRows}</Table.Tbody>
                </Table>
            </Modal>
        </Container>
        
    )
}

export default AdminPubReportsPage;