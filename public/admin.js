async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`/admin/users/${userId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('User deleted successfully.');
            location.reload();
        } else {
            alert('Failed to delete user.');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('An error occurred while deleting the user.');
    }
}

function editUser(userId) {
    window.location.href = `/admin/users/edit/${userId}`;
}