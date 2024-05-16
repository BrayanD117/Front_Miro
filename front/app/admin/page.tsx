"use client";

import { useEffect, useState } from "react";
import { Checkbox, Container, Table } from "@mantine/core";
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

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/all`);
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, []);

    const rows = users.map((user, index) => (
        <Table.Tr
            key={user._id}
            style={{ backgroundColor: selectedRows.includes(index) ? 'var(--mantine-color-blue-light)' : undefined }}
        >
            <Table.Td>
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
            </Table.Td>
            <Table.Td>{user.id}</Table.Td>
            <Table.Td>{user.full_name}</Table.Td>
            <Table.Td>{user.position}</Table.Td>
            <Table.Td>{user.email}</Table.Td>
            <Table.Td>{user.roles.join(', ')}</Table.Td>
        </Table.Tr>
    ));

    return (
        <Container>
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
        </Container>
    );
};

export default AdminPage;
