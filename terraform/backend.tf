terraform {
  backend "s3" {
    bucket = "demanda-poc-tfstate-145292398795"
    key    = "terraform.tfstate"
    region = "us-east-1"
  }
}
