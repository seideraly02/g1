alter table otp_requests add column request_fingerprint varchar(64);

create index otp_requests_fingerprint_created_idx
  on otp_requests(request_fingerprint, created_at desc)
  where request_fingerprint is not null;
