output "public_ip" {
  value       = aws_eip.app.public_ip
  description = "Elastic IP for the instance"
}

output "instance_id" {
  value       = aws_instance.app.id
  description = "EC2 instance id"
}

output "ssh_command" {
  value       = "ssh -i <path-to-private-key> ubuntu@${aws_eip.app.public_ip}"
  description = "Convenience SSH command"
}
