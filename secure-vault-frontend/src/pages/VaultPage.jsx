import React, { useState, useEffect, useContext } from 'react';
import { getVault, updateVault } from '../services/vaultService';
import { AuthContext } from '../context/AuthContext';
import { encrypt, decrypt } from '../services/cryptoService';

import {
  TextField,
  Button,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Snackbar,
  Alert,
  Box,
  Tooltip
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const VaultPage = () => {

  const [decryptedVault, setDecryptedVault] = useState([
    {
      platform:'',
      username:'',
      password:''
    }
  ]);

  const [showPasswords,setShowPasswords] = useState({});
  const [error,setError] = useState('');
  const [tempPassword,setTempPassword] = useState('');
  const [snackbarOpen,setSnackbarOpen] = useState(false);
  const [snackbarMessage,setSnackbarMessage] = useState('');

  const { auth } = useContext(AuthContext);

  const getMasterPassword = () =>
    auth.masterPassword || tempPassword;



  useEffect(() => {

    const fetchVault = async () => {
      try {

        const masterPassword = getMasterPassword();

        if(!masterPassword) return;

        const { data } = await getVault();

        if(data.encryptedBlob){

          try{
            const decrypted = decrypt(
              data.encryptedBlob,
              masterPassword
            );

            const parsedData = JSON.parse(decrypted);

            setDecryptedVault(parsedData);

          }catch(e){
            console.error(e);

            setError(
              'Failed to decrypt vault.'
            );
          }

        }else{

          setDecryptedVault([
            {
              platform:'',
              username:'',
              password:''
            }
          ]);
        }

      } catch(err){
        console.error(err);

        setError(
          err?.response?.data?.message ||
          'Error fetching vault'
        );
      }
    };

    if(auth.isAuthenticated){
      fetchVault();
    }

  },[
    auth.isAuthenticated,
    auth.masterPassword,
    tempPassword
  ]);



  const handleUpdate = async () => {

    try{

      const masterPassword = getMasterPassword();

      if(!masterPassword){
        setError('Master password missing');
        return;
      }

      const encryptedBlob = encrypt(
        JSON.stringify(decryptedVault),
        masterPassword
      );

      await updateVault(encryptedBlob);

      setSnackbarMessage(
        'Vault updated successfully!'
      );

      setSnackbarOpen(true);

    }catch(err){

      console.error(err);

      setError(
        err?.response?.data?.message ||
        'Error updating vault'
      );
    }

  };



  // COPY PASSWORD
  const handleCopyPassword = async(password)=>{

    try{

      if(!password){
        setSnackbarMessage(
          'No password to copy'
        );
        setSnackbarOpen(true);
        return;
      }

      if(
        navigator.clipboard &&
        window.isSecureContext
      ){
        await navigator.clipboard.writeText(password);
      }

      else{

        const textArea =
          document.createElement("textarea");

        textArea.value=password;
        textArea.style.position='fixed';
        textArea.style.left='-999999px';

        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        document.execCommand('copy');

        textArea.remove();
      }

      setSnackbarMessage(
        'Password copied!'
      );

      setSnackbarOpen(true);

    }catch(err){

      console.error(err);

      setSnackbarMessage(
        'Copy failed'
      );

      setSnackbarOpen(true);
    }

  };



  // SHOW PASSWORD + AUTO HIDE AFTER 5 SEC
  const togglePasswordVisibility = (index)=>{

    if(showPasswords[index]){

      setShowPasswords(prev=>({
        ...prev,
        [index]:false
      }));

      return;
    }

    setShowPasswords(prev=>({
      ...prev,
      [index]:true
    }));


    setTimeout(()=>{

      setShowPasswords(prev=>({
        ...prev,
        [index]:false
      }));

    },5000);

  };



  const handleCloseSnackbar = (
    event,
    reason
  )=>{
    if(reason==='clickaway') return;
    setSnackbarOpen(false);
  };



  const handleCellChange = (
    index,
    field,
    value
  )=>{

    const updated=[...decryptedVault];

    updated[index][field]=value;

    setDecryptedVault(updated);
  };



  const handleAddRow=()=>{
    setDecryptedVault([
      ...decryptedVault,
      {
        platform:'',
        username:'',
        password:''
      }
    ]);
  };



  const handleRemoveRow=(index)=>{
    setDecryptedVault(
      decryptedVault.filter(
        (_,i)=>i!==index
      )
    );
  };



  if(
    auth.isAuthenticated &&
    !auth.masterPassword &&
    !tempPassword
  ){

    return(
      <Container maxWidth="xs">

        <Box
          sx={{
            mt:8,
            display:'flex',
            flexDirection:'column',
            alignItems:'center'
          }}
        >

          <Paper
            elevation={3}
            sx={{
              p:4,
              width:'100%'
            }}
          >

            <Typography
              variant="h5"
              gutterBottom
            >
              Session Found
            </Typography>

            <Typography
              sx={{mb:3}}
            >
              Re-enter master password
            </Typography>


            <form
             onSubmit={(e)=>{
              e.preventDefault();

              setTempPassword(
                document.getElementById(
                  'temp-password'
                ).value
              );

             }}
            >

              <TextField
                id="temp-password"
                label="Master Password"
                type="password"
                fullWidth
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{mt:2}}
              >
                Unlock Vault
              </Button>

            </form>

          </Paper>

        </Box>

      </Container>
    );
  }



  return (

    <Container maxWidth="lg">

      <Box
       sx={{
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center',
        mt:4,
        mb:4
       }}
      >

        <Typography
         variant="h4"
         sx={{
          fontWeight:700,
          background:
          'linear-gradient(to right,#60a5fa,#3b82f6)',
          WebkitBackgroundClip:'text',
          WebkitTextFillColor:'transparent'
         }}
        >
          My Vault
        </Typography>


        <Box>

          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon/>}
            onClick={handleAddRow}
            sx={{mr:2}}
          >
            Add Item
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon/>}
            onClick={handleUpdate}
          >
            Save Changes
          </Button>

        </Box>

      </Box>



      {error &&
       <Alert
        severity="error"
        sx={{mb:3}}
       >
         {error}
       </Alert>
      }



      <TableContainer
       component={Paper}
      >
        <Table>

          <TableHead>

            <TableRow>

              <TableCell>
                Platform
              </TableCell>

              <TableCell>
                Username
              </TableCell>

              <TableCell>
                Password
              </TableCell>

              <TableCell align="center">
                Actions
              </TableCell>

            </TableRow>

          </TableHead>


          <TableBody>

            {
              decryptedVault.map(
                (row,index)=>(
                  <TableRow
                   key={index}
                   hover
                  >

                    <TableCell>
                      <TextField
                       value={row.platform}
                       onChange={(e)=>
                        handleCellChange(
                         index,
                         'platform',
                         e.target.value
                        )
                       }
                       fullWidth
                       size="small"
                      />
                    </TableCell>


                    <TableCell>
                      <TextField
                       value={row.username}
                       onChange={(e)=>
                        handleCellChange(
                         index,
                         'username',
                         e.target.value
                        )
                       }
                       fullWidth
                       size="small"
                      />
                    </TableCell>



                    <TableCell>

                      <Box
                       sx={{
                        display:'flex',
                        alignItems:'center'
                       }}
                      >

                        <TextField
                         value={row.password}
                         onChange={(e)=>
                          handleCellChange(
                           index,
                           'password',
                           e.target.value
                          )
                         }

                         type={
                          showPasswords[index]
                           ? "text"
                           : "password"
                         }

                         fullWidth
                         size="small"
                        />



                        <Tooltip title="Show for 5 seconds">
                          <IconButton
                           onClick={()=>
                            togglePasswordVisibility(
                              index
                            )
                           }
                           sx={{ml:1}}
                          >

                            {
                              showPasswords[index]
                              ?
                              <VisibilityOffIcon/>
                              :
                              <VisibilityIcon/>
                            }

                          </IconButton>
                        </Tooltip>



                        <Tooltip title="Copy Password">
                          <IconButton
                           onClick={()=>
                            handleCopyPassword(
                              row.password
                            )
                           }
                           sx={{
                            ml:1,
                            color:'primary.main'
                           }}
                          >
                           <ContentCopyIcon/>
                          </IconButton>
                        </Tooltip>


                      </Box>

                    </TableCell>



                    <TableCell align="center">

                      <Tooltip title="Delete Item">
                        <IconButton
                         color="error"
                         onClick={()=>
                          handleRemoveRow(index)
                         }
                        >
                          <DeleteIcon/>
                        </IconButton>
                      </Tooltip>

                    </TableCell>



                  </TableRow>
                )
              )
            }

          </TableBody>

        </Table>
      </TableContainer>



      <Snackbar
       open={snackbarOpen}
       autoHideDuration={3000}
       onClose={handleCloseSnackbar}
      >
        <Alert
         onClose={handleCloseSnackbar}
         severity="success"
         sx={{width:'100%'}}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>


    </Container>

  );
};

export default VaultPage;
