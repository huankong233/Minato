interface helpData {
  commandList: command[]
}

interface command {
  commandName: string
  commandDescription: string[]
  admin: boolean
}
