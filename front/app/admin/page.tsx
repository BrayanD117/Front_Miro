"use client";

import { useEffect, useState } from "react";
import { Center, Checkbox, Container, Pagination, Table } from "@mantine/core";
import axios from "axios";

interface User {
    _id: string;
    id: number;
    full_name: string;
    position: string;
    email: string;
    roles: string[];
}

const AdminPage = () => {
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchUsers = async (page: number) => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/allPagination`, {
                    params: { page, limit: 10 }
                });
                console.log(response.data);
                if (response.data) {
                    setUsers(response.data.users || []);
                    setTotalPages(response.data.pages || 1);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
                setUsers([]);
            }
        };

        fetchUsers(page);
    }, [page]);

    const rows =  users && users.map((user, index) => (
        <Table.Tr
            key={user._id}
            style={{ backgroundColor: selectedRows.includes(index) ? 'var(--mantine-color-blue-light)' : undefined }}
        >
            <Table.Th>
                <Checkbox
                    aria-label="Select row"
                    checked={selectedRows.includes(index)}
                    onChange={(event) =>
                        setSelectedRows(
                            event.currentTarget.checked
                                ? [...selectedRows, index]
                                : selectedRows.filter((position) => position !== index)
                        )
                    }
                />
            </Table.Th>
            <Table.Th>{user.id}</Table.Th>
            <Table.Th>{user.full_name}</Table.Th>
            <Table.Th>{user.position}</Table.Th>
            <Table.Th>{user.email}</Table.Th>
            <Table.Th>{user.roles.join(', ')}</Table.Th>
        </Table.Tr>
    ));

    return (
        <Container size="xl">
            <Table striped withTableBorder>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Select</Table.Th>
                        <Table.Th>ID</Table.Th>
                        <Table.Th>Full Name</Table.Th>
                        <Table.Th>Position</Table.Th>
                        <Table.Th>Email</Table.Th>
                        <Table.Th>Roles</Table.Th>
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
    );
};

export default AdminPage;
