<?php
require __DIR__.'/bootstrap.php';method('GET');
function present(array $p):array{
 $p['id']=(string)$p['id'];$p['price']=(float)$p['price'];$p['area']=(float)$p['area'];$p['bhk']=(int)$p['bhk'];$p['bathrooms']=(int)$p['bathrooms'];
 $p['location']=$p['locality'].', '.$p['city'];$p['badge']=$p['status'];$p['map']=$p['location'];
 $p['amenities']=json_decode($p['amenities']?:'[]',true)?:[];$p['images']=json_decode($p['image_urls']?:'[]',true)?:[];
 unset($p['image_urls']);return $p;
}
try{
 $columns='id,title,listing_type AS type,category,locality,city,price,area,bhk,bathrooms,availability AS status,description,amenities,image_urls';
 if(isset($_GET['id'])){
  $id=filter_var($_GET['id'],FILTER_VALIDATE_INT);if(!$id||$id<1)reply(['error'=>'Invalid ID'],422);
  $s=db()->prepare("SELECT $columns FROM properties WHERE id=? AND status='approved'");$s->execute([$id]);$p=$s->fetch();
  if(!$p)reply(['error'=>'Property not found'],404);reply(['property'=>present($p)]);
 }
 $s=db()->query("SELECT $columns FROM properties WHERE status='approved' ORDER BY approved_at DESC,id DESC LIMIT 100");
 reply(['properties'=>array_map('present',$s->fetchAll())]);
}catch(PDOException $e){error_log($e->getMessage());reply(['error'=>'Database unavailable'],503);}
