<?php

if (isset($_GET["bids"])) {
    $bids = $_GET["bids"];
    $file = $_GET["file"];
    $subj = substr($file, 0, 9);
    $path = $subj . '/' . $bids . '/' . $file; // e.g. //ievappwpdcpvm01.nyumc.org/?file=sub-NY758_ntoolsbrowser.json&bids=ieeg
} else {
    $file = $_GET["file"];
    $subj = substr($file, 0, 5);
    $path = $subj . '/' . $file; // e.g. //ievappwpdcpvm01.nyumc.org/?file=NY758.json
}
//echo $path 

$fp = fopen($path,"rb");
header('Content-Type: text/html; charset=utf-8');
header("Content-Length: " . filesize($path));
header("Access-Control-Allow-Origin: *");
fpassthru($fp);
//fclose($fp);
?>
