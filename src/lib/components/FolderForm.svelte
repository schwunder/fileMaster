<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { formSchema, type FormSchema } from '$lib/schemas';
	import { type SuperValidated, superForm, type SuperForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	export let data: SuperValidated<FormSchema>;
	export let handleAddFolder: (folderPath: string) => Promise<void>;

	const form = superForm<FormSchema>(data, {
		validators: zodClient(formSchema),
		onSubmit: ({ formData }) => {
			const folderPath = formData.get('folderPath') as string;
			handleAddFolder(folderPath);
		}
	});

	const { form: formData, enhance, errors, constraints } = form;
</script>

<form method="POST" use:enhance class="flex flex-row items-center justify-center space-x-4">
	<Form.Field {form} name="folderPath">
		<Form.Control let:attrs>
			<Form.Label>Folder Path</Form.Label>
			<Input {...attrs} bind:value={$formData.folderPath} />
		</Form.Control>
		<Form.Description>Enter a folder path (2-50 characters).</Form.Description>
		<Form.FieldErrors />
	</Form.Field>
	<Button type="submit">Add Folder</Button>
</form>
