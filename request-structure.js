const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer  base64tokenvalue'
  },
  body: '{"content":"# first stringified comment\n## Subheader\n Some text","task_id":"todoisttaskidhere"}'
};

const request = await fetch('https://api.todoist.com/api/v1/comments', options)
